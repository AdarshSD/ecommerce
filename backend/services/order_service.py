import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from background.notifications import send_order_confirmation
from core.constants import ErrorCode, InventoryChangeReason, OrderStatus, PaymentStatus
from core.exceptions import AppError
from models.cart import Cart
from models.config import StoreConfig
from models.order import InventoryLog, Order, OrderItem
from models.product import Product
from models.user import Address


def _build_order_response(order: Order) -> dict:
    return {
        "id": order.id,
        "status": order.status,
        "subtotal": float(order.subtotal),
        "shipping_cost": float(order.shipping_cost),
        "tax": float(order.tax),
        "total": float(order.total),
        "currency": order.currency,
        "payment_reference": order.payment_reference,
        "payment_status": order.payment_status,
        "tracking_number": order.tracking_number,
        "notes": order.notes,
        "created_at": order.created_at,
        "items": [
            {
                "product_id": item.product_id,
                "title": item.product.title if item.product else "Unknown",
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "line_total": float(item.line_total),
            }
            for item in order.items
        ],
    }


async def place_order(db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID, notes: str | None) -> dict:
    # 1. Validate address belongs to user
    addr_result = await db.execute(select(Address).where(Address.id == address_id, Address.user_id == user_id))
    if not addr_result.scalar_one_or_none():
        raise AppError(ErrorCode.ADDRESS_NOT_FOUND, "Address not found.", status_code=404)

    # 2. Load user's cart with items
    cart_result = await db.execute(
        select(Cart).where(Cart.user_id == user_id).options(selectinload(Cart.items))
    )
    cart = cart_result.scalar_one_or_none()
    if not cart or not cart.items:
        raise AppError(ErrorCode.CART_EMPTY, "Your cart is empty.", status_code=400)

    # 3. Load active store config for pricing rules
    config_result = await db.execute(select(StoreConfig).where(StoreConfig.is_active.is_(True)))
    config = config_result.scalar_one_or_none()
    tax_rate = float(config.tax_rate) if config else 0.0
    shipping_cost = float(config.flat_shipping_rate) if config else 0.0
    currency = config.currency_code if config else "USD"
    free_threshold = float(config.free_shipping_threshold) if config and config.free_shipping_threshold else None

    # 4. Row-lock products to prevent oversell
    product_ids = [item.product_id for item in cart.items]
    locked_result = await db.execute(
        select(Product)
        .where(Product.id.in_(product_ids), Product.is_deleted.is_(False))
        .with_for_update()
    )
    products = {p.id: p for p in locked_result.scalars().all()}

    # 5. Validate stock and compute totals
    order_items_data = []
    subtotal = 0.0
    for cart_item in cart.items:
        product = products.get(cart_item.product_id)
        if not product:
            raise AppError(ErrorCode.PRODUCT_NOT_FOUND, f"Product not found.", status_code=404)
        if product.stock_count < cart_item.quantity:
            raise AppError(ErrorCode.STOCK_CONFLICT, f"'{product.title}' only has {product.stock_count} left in stock.", status_code=409)
        unit_price = float(product.price)
        line_total = round(unit_price * cart_item.quantity, 2)
        subtotal += line_total
        order_items_data.append({
            "product": product,
            "product_id": cart_item.product_id,
            "quantity": cart_item.quantity,
            "unit_price": unit_price,
            "line_total": line_total,
        })

    subtotal = round(subtotal, 2)
    if free_threshold and subtotal >= free_threshold:
        shipping_cost = 0.0
    tax = round(subtotal * tax_rate, 2)
    total = round(subtotal + shipping_cost + tax, 2)

    # 6. Create order
    dummy_ref = f"DUMMY-{uuid.uuid4()}"
    order = Order(
        user_id=user_id,
        address_id=address_id,
        status=OrderStatus.CONFIRMED,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        tax=tax,
        total=total,
        currency=currency,
        payment_reference=dummy_ref,
        payment_status=PaymentStatus.DUMMY,
        notes=notes,
    )
    db.add(order)
    await db.flush()

    # 7. Create order items, decrement stock, log inventory changes
    for item_data in order_items_data:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            line_total=item_data["line_total"],
        ))
        product = item_data["product"]
        old_stock = product.stock_count
        product.stock_count -= item_data["quantity"]
        product.is_in_stock = product.stock_count > 0
        db.add(InventoryLog(
            product_id=product.id,
            order_id=order.id,
            old_stock=old_stock,
            new_stock=product.stock_count,
            change_reason=InventoryChangeReason.ORDER_PLACED,
        ))

    # 8. Clear cart
    for cart_item in list(cart.items):
        await db.delete(cart_item)

    await db.commit()

    # 9. Load order with items for response
    order_result = await db.execute(
        select(Order).where(Order.id == order.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .execution_options(populate_existing=True)
    )
    order = order_result.scalar_one()

    send_order_confirmation(str(user_id), str(order.id), total)  # [P3-EMAIL] stub
    return _build_order_response(order)


async def get_orders(db: AsyncSession, user_id: uuid.UUID, page: int, page_size: int) -> tuple[list[dict], int]:
    from sqlalchemy import func
    total = (await db.execute(
        select(func.count()).select_from(Order).where(Order.user_id == user_id)
    )).scalar_one()

    orders = list((await db.execute(
        select(Order).where(Order.user_id == user_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all())

    return [_build_order_response(o) for o in orders], total


async def get_order(db: AsyncSession, user_id: uuid.UUID, order_id: uuid.UUID, is_admin: bool = False) -> dict:
    result = await db.execute(
        select(Order).where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise AppError(ErrorCode.ORDER_NOT_FOUND, "Order not found.", status_code=404)
    if not is_admin and order.user_id != user_id:
        raise AppError(ErrorCode.FORBIDDEN, "Access denied.", status_code=403)
    return _build_order_response(order)
