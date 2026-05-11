import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

import services.product_service as product_service
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import require_admin
from models.user import User
from models.product import ProductCategoryLink, ProductEntityLink
from schemas.product_schemas import AdminProductResponse, CategoryBrief, CreateProductRequest, LinkedEntityBrief, UpdateProductRequest

router = APIRouter(prefix="/api/admin/products", tags=["Admin — Products"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


def _enrich(product) -> dict:
    d = AdminProductResponse.model_validate(product).model_dump()
    d["categories"] = [CategoryBrief.model_validate(link.category).model_dump() for link in product.category_links if link.category]
    d["linked_entities"] = [LinkedEntityBrief.model_validate(link.entity).model_dump() for link in sorted(product.entity_links, key=lambda x: x.display_order) if link.entity]
    return d


@router.get("", summary="List all products (admin)")
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category_id: uuid.UUID | None = None,
    include_deleted: bool = False,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    filters = {"page": page, "page_size": page_size, "include_deleted": include_deleted}
    if search:
        filters["search"] = search
    if category_id:
        filters["category_id"] = category_id
    products, total = await product_service.list_admin_products(db, filters)
    return {
        "data": [_enrich(p) for p in products],
        "meta": {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))},
    }


@router.post("", summary="Create a product", status_code=201)
async def create_product(
    body: CreateProductRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        product = await product_service.create_product(db, body.model_dump(), admin.id)
    except AppError as e:
        _raise(e)
    return {"data": _enrich(product), "meta": None}


@router.put("/{product_id}", summary="Update a product")
async def update_product(
    product_id: uuid.UUID,
    body: UpdateProductRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        product = await product_service.update_product(db, product_id, body.model_dump(exclude_none=True), admin.id)
    except AppError as e:
        _raise(e)
    return {"data": _enrich(product), "meta": None}


@router.delete("/{product_id}", summary="Soft-delete a product", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await product_service.delete_product(db, product_id)
    except AppError as e:
        _raise(e)
