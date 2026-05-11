import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorCode, InventoryChangeReason
from core.database import get_db
from middleware.auth_middleware import require_admin
from models.order import InventoryLog
from models.product import Product
from models.user import User
from schemas.inventory_schemas import InventoryLogEntry, InventoryProductRow, UpdateStockRequest

router = APIRouter(prefix="/api/admin/inventory", tags=["Admin — Inventory"])


@router.get("", summary="List inventory sorted by stock level (lowest first)")
async def list_inventory(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    low_stock_only: bool = False,
    out_of_stock_only: bool = False,
    search: str | None = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    q = select(Product).where(Product.is_deleted.is_(False))
    if out_of_stock_only:
        q = q.where(Product.stock_count == 0)
    elif low_stock_only:
        q = q.where(Product.stock_count <= Product.low_stock_threshold, Product.stock_count > 0)
    if search:
        q = q.where(Product.title.ilike(f"%{search}%"))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    out_of_stock_count = (await db.execute(select(func.count()).select_from(
        select(Product).where(Product.is_deleted.is_(False), Product.stock_count == 0).subquery()
    ))).scalar_one()
    low_stock_count = (await db.execute(select(func.count()).select_from(
        select(Product).where(Product.is_deleted.is_(False), Product.stock_count <= Product.low_stock_threshold, Product.stock_count > 0).subquery()
    ))).scalar_one()

    products = list((await db.execute(
        q.order_by(Product.stock_count.asc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all())

    return {
        "data": [InventoryProductRow.model_validate(p).model_dump() for p in products],
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, math.ceil(total / page_size)),
            "out_of_stock_count": out_of_stock_count,
            "low_stock_count": low_stock_count,
        },
    }


@router.patch("/{product_id}", summary="Update stock count")
async def update_stock(
    product_id: uuid.UUID,
    body: UpdateStockRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Product).where(Product.id == product_id, Product.is_deleted.is_(False)))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.PRODUCT_NOT_FOUND, "message": "Product not found."})

    old_stock = product.stock_count
    product.stock_count = body.stock_count
    product.is_in_stock = body.stock_count > 0
    if body.low_stock_threshold is not None:
        product.low_stock_threshold = body.low_stock_threshold

    db.add(InventoryLog(
        product_id=product.id,
        changed_by_user_id=admin.id,
        old_stock=old_stock,
        new_stock=body.stock_count,
        change_reason=InventoryChangeReason.ADMIN_UPDATE,
        reason_detail=body.reason,
    ))
    await db.commit()
    return {"data": InventoryProductRow.model_validate(product).model_dump(), "meta": None}


@router.get("/{product_id}/log", summary="Get inventory change history for a product")
async def get_inventory_log(
    product_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from sqlalchemy import func
    total = (await db.execute(
        select(func.count()).select_from(InventoryLog).where(InventoryLog.product_id == product_id)
    )).scalar_one()
    logs = list((await db.execute(
        select(InventoryLog).where(InventoryLog.product_id == product_id)
        .order_by(InventoryLog.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all())
    return {
        "data": [InventoryLogEntry.model_validate(log).model_dump() for log in logs],
        "meta": {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))},
    }
