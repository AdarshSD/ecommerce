import uuid
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorCode
from core.exceptions import AppError
from models.user import Address, User

_MAX_ADDRESSES = 10

# Sort order: home first, work second, other last, then by creation date
_LABEL_ORDER = case(
    (Address.label == "home", 0),
    (Address.label == "work", 1),
    else_=2,
)


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
        select(Address)
        .where(Address.user_id == user_id)
        .order_by(_LABEL_ORDER, Address.created_at)
    )
    return list(result.scalars().all())


async def _check_label_unique(
    db: AsyncSession,
    user_id: uuid.UUID,
    label: str,
    exclude_id: uuid.UUID | None = None,
) -> None:
    """Raise 409 if the user already has a home or work address (and it's not the current one)."""
    if label not in ("home", "work"):
        return
    q = select(Address.id).where(
        Address.user_id == user_id,
        Address.label == label,
    )
    if exclude_id:
        q = q.where(Address.id != exclude_id)
    existing = (await db.execute(q)).scalar_one_or_none()
    if existing:
        label_display = label.capitalize()
        raise AppError(
            ErrorCode.ADDRESS_LABEL_TAKEN,
            f"You already have a {label_display} address. Edit it or choose a different label.",
            status_code=409,
        )


async def create_address(db: AsyncSession, user_id: uuid.UUID, data: dict) -> Address:
    # Enforce 10-address limit
    count = (await db.execute(
        select(func.count()).where(Address.user_id == user_id)
    )).scalar_one()
    if count >= _MAX_ADDRESSES:
        raise AppError(
            ErrorCode.ADDRESS_LIMIT_REACHED,
            f"You can save a maximum of {_MAX_ADDRESSES} addresses. Please delete one first.",
            status_code=409,
        )

    # Enforce Home/Work uniqueness
    await _check_label_unique(db, user_id, data.get("label", "other"))

    if data.get("is_default"):
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

    # Enforce Home/Work uniqueness when label is being changed
    new_label = data.get("label")
    if new_label and new_label != address.label:
        await _check_label_unique(db, user_id, new_label, exclude_id=address.id)

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
