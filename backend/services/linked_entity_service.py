import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorCode
from core.exceptions import AppError
from models.linked_entity import LinkedEntity
from models.product import ProductEntityLink


async def _product_counts(db: AsyncSession, entity_ids: list[uuid.UUID]) -> dict:
    q = (
        select(ProductEntityLink.entity_id, func.count().label("cnt"))
        .where(ProductEntityLink.entity_id.in_(entity_ids))
        .group_by(ProductEntityLink.entity_id)
    )
    return {row.entity_id: row.cnt for row in (await db.execute(q)).all()}


async def list_entities(db: AsyncSession, page: int, page_size: int, search: str | None) -> tuple[list[dict], int]:
    q = select(LinkedEntity).where(LinkedEntity.is_deleted.is_(False))
    if search:
        q = q.where(LinkedEntity.name.ilike(f"%{search}%"))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    entities = list((await db.execute(q.order_by(LinkedEntity.name).offset((page - 1) * page_size).limit(page_size))).scalars().all())

    counts = await _product_counts(db, [e.id for e in entities])
    rows = []
    for e in entities:
        d = {col.name: getattr(e, col.name) for col in e.__table__.columns}
        d["product_count"] = counts.get(e.id, 0)
        rows.append(d)
    return rows, total


async def get_entity(db: AsyncSession, entity_id: uuid.UUID) -> LinkedEntity:
    result = await db.execute(
        select(LinkedEntity).where(LinkedEntity.id == entity_id, LinkedEntity.is_deleted.is_(False))
    )
    entity = result.scalar_one_or_none()
    if not entity:
        raise AppError(ErrorCode.ENTITY_NOT_FOUND, "Entity not found.", status_code=404)
    return entity


async def create_entity(db: AsyncSession, name: str, bio: str | None, profile_image_url: str | None) -> LinkedEntity:
    entity = LinkedEntity(name=name.strip(), bio=bio, profile_image_url=profile_image_url)
    db.add(entity)
    await db.commit()
    await db.refresh(entity)
    return entity


async def update_entity(db: AsyncSession, entity_id: uuid.UUID, data: dict) -> LinkedEntity:
    entity = await get_entity(db, entity_id)
    for field, value in data.items():
        if value is not None:
            setattr(entity, field, value)
    await db.commit()
    await db.refresh(entity)
    return entity


async def delete_entity(db: AsyncSession, entity_id: uuid.UUID) -> None:
    entity = await get_entity(db, entity_id)
    linked = (await db.execute(
        select(ProductEntityLink).where(ProductEntityLink.entity_id == entity_id).limit(1)
    )).scalar_one_or_none()
    if linked:
        raise AppError(ErrorCode.ENTITY_HAS_PRODUCTS, "Cannot delete an entity that has products assigned.", status_code=409)
    entity.is_deleted = True
    entity.deleted_at = datetime.now(timezone.utc)
    await db.commit()
