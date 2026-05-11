from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import services.config_service as config_service
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import require_admin
from models.user import User
from schemas.config_schemas import StoreConfigPublic, StoreConfigVersion, UpdateStoreConfigRequest

router = APIRouter(prefix="/api/admin/config", tags=["Admin — Store Config"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.get("/store/history", summary="List all config versions")
async def get_history(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    versions = await config_service.get_config_history(db)
    return {"data": [StoreConfigVersion.model_validate(v).model_dump() for v in versions], "meta": None}


@router.put("/store", summary="Update active store config (creates new version)")
async def update_config(
    body: UpdateStoreConfigRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        config = await config_service.update_config(db, body.model_dump(exclude_none=True), admin.id)
    except AppError as e:
        _raise(e)
    return {"data": StoreConfigPublic.model_validate(config).model_dump(), "meta": None}


@router.post("/store/rollback/{version}", summary="Activate a previous config version")
async def rollback_config(
    version: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        config = await config_service.rollback_config(db, version, admin.id)
    except AppError as e:
        _raise(e)
    return {"data": StoreConfigPublic.model_validate(config).model_dump(), "meta": None}
