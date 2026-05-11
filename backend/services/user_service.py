import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorCode
from core.exceptions import AppError
from models.user import Address, User


async def get_profile(db: AsyncSession, user: User) -> User:
    return user


async def update_profile(db: AsyncSession, user: User, data: dict) -> User:
    for field, value in data.items():
        if value is not None:
            setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def get_addresses(db: AsyncSession, user_id: uuid.UUID) -> list[Address]:
    result = await db.execute(
        select(Address).where(Address.user_id == user_id).order_by(Address.is_default.desc(), Address.created_at)
    )
    return list(result.scalars().all())


async def create_address(db: AsyncSession, user_id: uuid.UUID, data: dict) -> Address:
    if data.get("is_default"):
        # Clear existing default
        existing = await db.execute(
            select(Address).where(Address.user_id == user_id, Address.is_default.is_(True))
        )
        for addr in existing.scalars().all():
            addr.is_default = False

    address = Address(user_id=user_id, **data)
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


async def update_address(
    db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID, data: dict
) -> Address:
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == user_id)
    )
    address = result.scalar_one_or_none()
    if not address:
        raise AppError(ErrorCode.ADDRESS_NOT_FOUND, "Address not found.", status_code=404)

    if data.get("is_default"):
        existing = await db.execute(
            select(Address).where(Address.user_id == user_id, Address.is_default.is_(True))
        )
        for addr in existing.scalars().all():
            addr.is_default = False

    for field, value in data.items():
        if value is not None:
            setattr(address, field, value)

    await db.commit()
    await db.refresh(address)
    return address


async def delete_address(db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID) -> None:
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == user_id)
    )
    address = result.scalar_one_or_none()
    if not address:
        raise AppError(ErrorCode.ADDRESS_NOT_FOUND, "Address not found.", status_code=404)
    await db.delete(address)
    await db.commit()
