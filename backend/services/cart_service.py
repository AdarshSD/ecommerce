import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.constants import CartMergeStrategy, ErrorCode
from core.exceptions import AppError
from models.cart import Cart, CartItem
from models.product import Product


async def _get_or_create_cart(db: AsyncSession, user_id: uuid.UUID | None, session_token: str | None) -> Cart:
    if user_id:
        result = await db.execute(
            select(Cart).where(Cart.user_id == user_id)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
        )
        cart = result.scalar_one_or_none()
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            await db.flush()
    else:
        result = await db.execute(
            select(Cart).where(Cart.session_token == session_token)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
        )
        cart = result.scalar_one_or_none()
        if not cart:
            cart = Cart(
                session_token=session_token,
                expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            )
            db.add(cart)
            await db.flush()
    return cart


async def _load_cart(db: AsyncSession, cart_id: uuid.UUID) -> Cart:
    # Always query by UUID (not ORM object) to bypass the identity map cache
    # and get fresh items after any mutation + commit.
    result = await db.execute(
        select(Cart).where(Cart.id == cart_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .execution_options(populate_existing=True)
    )
    return result.scalar_one()


def _build_response(cart: Cart, is_guest: bool) -> dict:
    items = []
    subtotal = 0.0
    for item in cart.items:
        p = item.product
        unit_price = float(p.price)
        line_total = unit_price * item.quantity
        subtotal += line_total
        items.append({
            "product_id": item.product_id,
            "title": p.title,
            "cover_thumbnail_url": p.cover_thumbnail_url,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "price_at_add": float(item.price_at_add),
            "line_total": line_total,
            "is_in_stock": p.is_in_stock,
            "stock_count": p.stock_count,
        })
    return {
        "id": cart.id,
        "items": items,
        "subtotal": round(subtotal, 2),
        "item_count": sum(i["quantity"] for i in items),
        "requires_login_for_checkout": is_guest,
    }


async def get_cart(db: AsyncSession, user_id: uuid.UUID | None, session_token: str | None) -> dict:
    cart = await _get_or_create_cart(db, user_id, session_token)
    cart_id = cart.id
    await db.commit()
    cart = await _load_cart(db, cart_id)
    return _build_response(cart, user_id is None)


async def add_item(db: AsyncSession, user_id: uuid.UUID | None, session_token: str | None, product_id: uuid.UUID, quantity: int) -> dict:
    product = (await db.execute(select(Product).where(Product.id == product_id, Product.is_deleted.is_(False)))).scalar_one_or_none()
    if not product:
        raise AppError(ErrorCode.PRODUCT_NOT_FOUND, "Product not found.", status_code=404)
    if product.stock_count < 1:
        raise AppError(ErrorCode.PRODUCT_OUT_OF_STOCK, "Product is out of stock.", status_code=409)

    cart = await _get_or_create_cart(db, user_id, session_token)
    cart_id = cart.id

    existing = next((i for i in cart.items if i.product_id == product_id), None)
    if existing:
        existing.quantity = min(existing.quantity + quantity, product.stock_count)
    else:
        if product.stock_count < quantity:
            raise AppError(ErrorCode.INSUFFICIENT_STOCK, f"Only {product.stock_count} in stock.", status_code=409)
        # Use db.add() directly — avoids triggering lazy load on the new item's relationships
        db.add(CartItem(cart_id=cart_id, product_id=product_id, quantity=quantity, price_at_add=product.price))

    await db.commit()
    cart = await _load_cart(db, cart_id)
    return _build_response(cart, user_id is None)


async def update_item(db: AsyncSession, user_id: uuid.UUID | None, session_token: str | None, product_id: uuid.UUID, quantity: int) -> dict:
    cart = await _get_or_create_cart(db, user_id, session_token)
    cart_id = cart.id
    item = next((i for i in cart.items if i.product_id == product_id), None)
    if not item:
        raise AppError(ErrorCode.CART_ITEM_NOT_FOUND, "Item not found in cart.", status_code=404)

    if quantity < 1:
        await db.delete(item)
    else:
        item.quantity = quantity
    await db.commit()
    cart = await _load_cart(db, cart_id)
    return _build_response(cart, user_id is None)


async def remove_item(db: AsyncSession, user_id: uuid.UUID | None, session_token: str | None, product_id: uuid.UUID) -> dict:
    return await update_item(db, user_id, session_token, product_id, 0)


async def clear_cart(db: AsyncSession, user_id: uuid.UUID | None, session_token: str | None) -> dict:
    cart = await _get_or_create_cart(db, user_id, session_token)
    cart_id = cart.id
    for item in list(cart.items):
        await db.delete(item)
    await db.commit()
    cart = await _load_cart(db, cart_id)
    return _build_response(cart, user_id is None)


async def merge_carts(db: AsyncSession, user_id: uuid.UUID, session_token: str, strategy: CartMergeStrategy) -> dict:
    if strategy == CartMergeStrategy.SAVE_LATER:
        # [P2] save_later — not implemented yet
        raise AppError(ErrorCode.VALIDATION_ERROR, "save_later strategy is available in a future release.", status_code=400)

    guest_result = await db.execute(
        select(Cart).where(Cart.session_token == session_token)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    guest_cart = guest_result.scalar_one_or_none()

    user_result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    user_cart = user_result.scalar_one_or_none()
    if not user_cart:
        user_cart = Cart(user_id=user_id)
        db.add(user_cart)
        await db.flush()

    if not guest_cart:
        raise AppError(ErrorCode.NO_GUEST_CART, "No guest cart found.", status_code=404)

    if strategy == CartMergeStrategy.KEEP_USER:
        # Discard guest cart entirely
        for item in list(guest_cart.items):
            await db.delete(item)
        await db.delete(guest_cart)

    elif strategy == CartMergeStrategy.KEEP_GUEST:
        # Replace user cart with guest items
        for item in list(user_cart.items):
            await db.delete(item)
        await db.flush()
        for item in guest_cart.items:
            db.add(CartItem(cart_id=user_cart.id, product_id=item.product_id, quantity=item.quantity, price_at_add=item.price_at_add))
            await db.delete(item)
        await db.delete(guest_cart)

    elif strategy == CartMergeStrategy.COMBINE:
        user_items = {i.product_id: i for i in user_cart.items}
        for guest_item in guest_cart.items:
            if guest_item.product_id in user_items:
                user_item = user_items[guest_item.product_id]
                max_stock = guest_item.product.stock_count
                user_item.quantity = min(user_item.quantity + guest_item.quantity, max_stock)
            else:
                db.add(CartItem(cart_id=user_cart.id, product_id=guest_item.product_id, quantity=guest_item.quantity, price_at_add=guest_item.price_at_add))
            await db.delete(guest_item)
        await db.delete(guest_cart)

    user_cart_id = user_cart.id
    await db.commit()
    cart = await _load_cart(db, user_cart_id)
    return _build_response(cart, False)
