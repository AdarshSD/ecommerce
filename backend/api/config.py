from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import services.config_service as config_service
from core.database import get_db
from core.exceptions import AppError
from schemas.config_schemas import StoreConfigPublic

router = APIRouter(prefix="/api/config", tags=["Store Config"])


@router.get(
    "/store",
    summary="Get active store configuration",
    description="Returns the active theme, colours, fonts, homepage sections, labels, and policies. Called on every page load.",
)
async def get_store_config(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        config = await config_service.get_active_config(db)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})
    return {"data": StoreConfigPublic.model_validate(config).model_dump(), "meta": None}
