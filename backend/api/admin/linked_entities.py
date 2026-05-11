import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import services.linked_entity_service as entity_service
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import require_admin
from models.user import User
from schemas.linked_entity_schemas import CreateLinkedEntityRequest, LinkedEntityResponse, UpdateLinkedEntityRequest

router = APIRouter(prefix="/api/admin/linked-entities", tags=["Admin — Linked Entities"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.get("", summary="List all linked entities (admin)")
async def list_entities(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    entities, _ = await entity_service.list_entities(db, 1, 200, None)
    return {"data": [LinkedEntityResponse(**e).model_dump() for e in entities], "meta": None}


@router.post("", summary="Create a linked entity", status_code=201)
async def create_entity(
    body: CreateLinkedEntityRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    entity = await entity_service.create_entity(db, body.name, body.bio, body.profile_image_url)
    return {"data": LinkedEntityResponse.model_validate(entity).model_dump() | {"product_count": 0}, "meta": None}


@router.put("/{entity_id}", summary="Update a linked entity")
async def update_entity(
    entity_id: uuid.UUID,
    body: UpdateLinkedEntityRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        entity = await entity_service.update_entity(db, entity_id, body.model_dump(exclude_none=True))
    except AppError as e:
        _raise(e)
    return {"data": LinkedEntityResponse.model_validate(entity).model_dump() | {"product_count": 0}, "meta": None}


@router.delete("/{entity_id}", summary="Soft-delete a linked entity", status_code=204)
async def delete_entity(
    entity_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await entity_service.delete_entity(db, entity_id)
    except AppError as e:
        _raise(e)
