import math
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

import services.product_service as product_service
from core.database import get_db
from core.exceptions import AppError
from models.product import ProductCategoryLink, ProductEntityLink
from schemas.product_schemas import CategoryBrief, LinkedEntityBrief, ProductDetail, ProductSummary

router = APIRouter(prefix="/api/products", tags=["Products"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


def _enrich_detail(product) -> dict:
    d = ProductDetail.model_validate(product).model_dump()
    d["categories"] = [CategoryBrief.model_validate(link.category).model_dump() for link in product.category_links if link.category]
    d["linked_entities"] = [LinkedEntityBrief.model_validate(link.entity).model_dump() for link in sorted(product.entity_links, key=lambda x: x.display_order) if link.entity]
    return d


@router.get(
    "",
    summary="List products",
    description="""
Paginated product catalog with filtering and sorting.

**Filters:** category_id, entity_id, min_price, max_price, format, in_stock,
is_featured, is_recommended, is_bestseller, search (title match).

**Sort:** newest (default), price_asc, price_desc, bestseller, title_asc.

**Guest access:** No authentication required.
    """,
)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("newest"),
    category_id: uuid.UUID | None = None,
    entity_id: uuid.UUID | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    format: str | None = None,
    in_stock: bool | None = None,
    is_featured: bool | None = None,
    is_recommended: bool | None = None,
    is_bestseller: bool | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    filters = {k: v for k, v in locals().items() if k not in ("db",) and v is not None}
    filters["page"] = page
    filters["page_size"] = page_size
    products, total = await product_service.list_products(db, filters)
    return {
        "data": [ProductSummary.model_validate(p).model_dump() for p in products],
        "meta": {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))},
    }


@router.get(
    "/section/{section_id}",
    summary="Get products for a homepage section",
    description="Resolves a homepage section ID from the active store config and returns its products.",
)
async def get_section_products(section_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    try:
        products = await product_service.get_section_products(db, section_id)
    except AppError as e:
        _raise(e)
    return {"data": [ProductSummary.model_validate(p).model_dump() for p in products], "meta": None}


@router.get(
    "/{product_id}",
    summary="Get product detail",
    description="Full product detail including categories and linked entities. Guest access allowed.",
)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> dict:
    try:
        product = await product_service.get_product(db, product_id)
    except AppError as e:
        _raise(e)
    return {"data": _enrich_detail(product), "meta": None}
