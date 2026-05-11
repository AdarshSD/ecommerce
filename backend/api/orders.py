import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

import services.order_service as order_service
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.order_schemas import CheckoutRequest

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.post(
    "",
    summary="Place an order (dummy checkout)",
    description="""
Checks out the current cart. Requires authentication — guests are redirected to login.

Stock is validated and decremented server-side. Totals are recalculated (never trusted from client).
Payment is dummy in P1/P2: `payment_status='DUMMY'`, `payment_reference='DUMMY-{uuid}'`.
Cart is cleared after successful order creation.
    """,
    status_code=201,
)
async def place_order(
    body: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        order = await order_service.place_order(db, user.id, body.address_id, body.notes)
    except AppError as e:
        _raise(e)
    return {"data": order, "meta": None}


@router.get("", summary="List current user's orders")
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    orders, total = await order_service.get_orders(db, user.id, page, page_size)
    return {
        "data": orders,
        "meta": {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))},
    }


@router.get("/{order_id}", summary="Get order detail")
async def get_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        order = await order_service.get_order(db, user.id, order_id)
    except AppError as e:
        _raise(e)
    return {"data": order, "meta": None}
