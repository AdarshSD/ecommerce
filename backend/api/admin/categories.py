import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import services.category_service as category_service
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import require_admin
from models.user import User
from schemas.category_schemas import CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest

router = APIRouter(prefix="/api/admin/categories", tags=["Admin — Categories"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.get("", summary="List all categories (admin, includes inactive)")
async def list_categories(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    categories = await category_service.list_all_categories(db)
    return {"data": [CategoryResponse(**c).model_dump() for c in categories], "meta": None}


@router.post("", summary="Create a category", status_code=201)
async def create_category(
    body: CreateCategoryRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    cat = await category_service.create_category(db, body.name, body.description, body.display_order, body.image_url)
    return {"data": CategoryResponse.model_validate(cat).model_dump() | {"product_count": 0}, "meta": None}


@router.put("/{category_id}", summary="Update a category")
async def update_category(
    category_id: uuid.UUID,
    body: UpdateCategoryRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        cat = await category_service.update_category(db, category_id, body.model_dump(exclude_none=True))
    except AppError as e:
        _raise(e)
    return {"data": CategoryResponse.model_validate(cat).model_dump() | {"product_count": 0}, "meta": None}


@router.delete("/{category_id}", summary="Deactivate a category", status_code=204)
async def delete_category(
    category_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await category_service.delete_category(db, category_id)
    except AppError as e:
        _raise(e)
