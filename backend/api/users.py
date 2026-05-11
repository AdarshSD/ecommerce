import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import services.user_service as user_service
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.auth_schemas import UserResponse
from schemas.user_schemas import AddressRequest, AddressResponse, UpdateAddressRequest, UpdateProfileRequest

router = APIRouter(prefix="/api/users", tags=["Users"])


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.get("/me", summary="Get current user profile")
async def get_profile(user: User = Depends(get_current_user)) -> dict:
    return {"data": UserResponse.model_validate(user), "meta": None}


@router.put("/me", summary="Update current user profile")
async def update_profile(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    updated = await user_service.update_profile(db, user, body.model_dump(exclude_none=True))
    return {"data": UserResponse.model_validate(updated), "meta": None}


@router.get("/me/addresses", summary="List all addresses for current user")
async def list_addresses(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    addresses = await user_service.get_addresses(db, user.id)
    return {"data": [AddressResponse.model_validate(a) for a in addresses], "meta": None}


@router.post("/me/addresses", summary="Create a new address", status_code=201)
async def create_address(
    body: AddressRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        address = await user_service.create_address(db, user.id, body.model_dump())
    except AppError as e:
        _raise(e)
    return {"data": AddressResponse.model_validate(address), "meta": None}


@router.put("/me/addresses/{address_id}", summary="Update an address")
async def update_address(
    address_id: uuid.UUID,
    body: UpdateAddressRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        address = await user_service.update_address(db, user.id, address_id, body.model_dump(exclude_none=True))
    except AppError as e:
        _raise(e)
    return {"data": AddressResponse.model_validate(address), "meta": None}


@router.delete("/me/addresses/{address_id}", summary="Delete an address", status_code=204)
async def delete_address(
    address_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await user_service.delete_address(db, user.id, address_id)
    except AppError as e:
        _raise(e)
