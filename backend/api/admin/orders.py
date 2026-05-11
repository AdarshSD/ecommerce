import math
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import services.order_service as order_service
from core.constants import ErrorCode, InventoryChangeReason, ORDER_STATUS_TRANSITIONS, OrderStatus
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import require_admin
from models.order import InventoryLog, Order, OrderItem
from models.product import Product
from models.user import User
from schemas.inventory_schemas import UpdateOrderStatusRequest

router = APIRouter(prefix="/api/admin/orders", tags=["Admin — Orders"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.get("", summary="List all orders (admin)")
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from sqlalchemy import func
    q = select(Order)
    if status:
        q = q.where(Order.status == status)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    orders = list((await db.execute(
        q.options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all())
    return {
        "data": [order_service._build_order_response(o) for o in orders],
        "meta": {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))},
    }


@router.patch("/{order_id}/status", summary="Update order status")
async def update_order_status(
    order_id: uuid.UUID,
    body: UpdateOrderStatusRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Order).where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.ORDER_NOT_FOUND, "message": "Order not found."})

    current = OrderStatus(order.status)
    try:
        new_status = OrderStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=422, detail={"code": ErrorCode.INVALID_STATUS_TRANSITION, "message": f"'{body.status}' is not a valid order status."})

    if new_status not in ORDER_STATUS_TRANSITIONS.get(current, set()):
        raise HTTPException(status_code=422, detail={
            "code": ErrorCode.INVALID_STATUS_TRANSITION,
            "message": f"Cannot transition from {current.value} to {new_status.value}.",
        })

    now = datetime.now(timezone.utc)
    order.status = new_status.value

    if new_status == OrderStatus.SHIPPED:
        order.shipped_at = now
        if body.tracking_number:
            order.tracking_number = body.tracking_number
    elif new_status == OrderStatus.DELIVERED:
        order.delivered_at = now
    elif new_status == OrderStatus.CANCELLED:
        order.cancelled_at = now
        # Restore stock
        for item in order.items:
            product = item.product
            if product:
                old_stock = product.stock_count
                product.stock_count += item.quantity
                product.is_in_stock = True
                db.add(InventoryLog(
                    product_id=product.id,
                    order_id=order.id,
                    changed_by_user_id=admin.id,
                    old_stock=old_stock,
                    new_stock=product.stock_count,
                    change_reason=InventoryChangeReason.ORDER_CANCELLED,
                ))
    elif new_status == OrderStatus.REFUNDED:
        pass  # [P3-PAYMENT] stub — no Stripe refund yet

    await db.commit()
    order_data = await order_service.get_order(db, admin.id, order_id, is_admin=True)
    return {"data": order_data, "meta": None}
