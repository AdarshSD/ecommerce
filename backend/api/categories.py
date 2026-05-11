from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

import services.category_service as category_service
from core.database import get_db
from schemas.category_schemas import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get(
    "",
    summary="List all active categories",
    description="Returns all active categories ordered by display_order. Includes product_count per category.",
)
async def list_categories(db: AsyncSession = Depends(get_db)) -> dict:
    categories = await category_service.list_categories(db)
    return {"data": [CategoryResponse(**c).model_dump() for c in categories], "meta": None}
