import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

import services.product_service as product_service
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import require_admin
from models.user import User
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
    sort: str = Query("newest"),
    category_id: uuid.UUID | None = None,
    is_featured: bool | None = None,
    is_bestseller: bool | None = None,
    is_new_arrival: bool | None = None,
    in_stock: bool | None = None,
    include_deleted: bool = False,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    filters: dict = {"page": page, "page_size": page_size, "sort": sort, "include_deleted": include_deleted}
    if search:       filters["search"] = search
    if category_id:  filters["category_id"] = category_id
    if is_featured   is not None: filters["is_featured"]   = is_featured
    if is_bestseller is not None: filters["is_bestseller"] = is_bestseller
    if is_new_arrival is not None: filters["is_new_arrival"] = is_new_arrival
    if in_stock      is not None: filters["in_stock"]      = in_stock
    products, total = await product_service.list_admin_products(db, filters)
    return {
        "data": [_enrich(p) for p in products],
        "meta": {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))},
    }


@router.get("/{product_id}", summary="Get a single product (admin, includes stock)")
async def get_product(
    product_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        product = await product_service.get_product(db, product_id)
    except AppError as e:
        _raise(e)
    return {"data": _enrich(product), "meta": None}


@router.post("", summary="Create a product", status_code=201)
async def create_product(
    body: CreateProductRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        product = await product_service.create_product(db, body.model_dump(), _admin.id)
    except AppError as e:
        _raise(e)
    return {"data": _enrich(product), "meta": None}


@router.put("/{product_id}", summary="Update a product")
async def update_product(
    product_id: uuid.UUID,
    body: UpdateProductRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        product = await product_service.update_product(db, product_id, body.model_dump(exclude_none=True), _admin.id)
    except AppError as e:
        _raise(e)
    return {"data": _enrich(product), "meta": None}


@router.delete("/{product_id}", summary="Soft-delete a product", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await product_service.delete_product(db, product_id)
    except AppError as e:
        _raise(e)
