import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

import services.linked_entity_service as entity_service
import services.product_service as product_service
from core.database import get_db
from core.exceptions import AppError
from schemas.linked_entity_schemas import LinkedEntityResponse
from schemas.product_schemas import ProductSummary

router = APIRouter(prefix="/api/linked-entities", tags=["Linked Entities"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.get(
    "",
    summary="List linked entities",
    description="Paginated list of linked entities (e.g. authors). Supports search by name.",
)
async def list_entities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    entities, total = await entity_service.list_entities(db, page, page_size, search)
    return {
        "data": [LinkedEntityResponse(**e).model_dump() for e in entities],
        "meta": {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))},
    }


@router.get(
    "/{entity_id}",
    summary="Get linked entity detail",
    description="Entity detail plus paginated list of their products.",
)
async def get_entity(
    entity_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        entity = await entity_service.get_entity(db, entity_id)
    except AppError as e:
        _raise(e)
    products, total = await product_service.list_products(db, {"entity_id": entity_id, "page": page, "page_size": page_size})
    return {
        "data": {
            "entity": LinkedEntityResponse.model_validate(entity).model_dump(),
            "products": [ProductSummary.model_validate(p).model_dump() for p in products],
        },
        "meta": {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))},
    }
