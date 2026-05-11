from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorCode
from core.exceptions import AppError
from models.config import StoreConfig


async def get_active_config(db: AsyncSession) -> StoreConfig:
    result = await db.execute(select(StoreConfig).where(StoreConfig.is_active.is_(True)))
    config = result.scalar_one_or_none()
    if not config:
        raise AppError(ErrorCode.CONFIG_NOT_FOUND, "No active store configuration found.", status_code=404)
    return config


async def get_config_history(db: AsyncSession) -> list[StoreConfig]:
    result = await db.execute(select(StoreConfig).order_by(StoreConfig.version.desc()))
    return list(result.scalars().all())


async def update_config(db: AsyncSession, updates: dict, admin_user_id) -> StoreConfig:
    result = await db.execute(select(StoreConfig).where(StoreConfig.is_active.is_(True)))
    current = result.scalar_one_or_none()

    if current is None:
        # No config exists yet — create the first one directly from the updates
        new_data = {k: v for k, v in updates.items() if v is not None}
        if "store_name" not in new_data:
            new_data["store_name"] = "Leaf & Lore"
        new_data["version"] = 1
        new_data["is_active"] = True
        new_data["created_by_user_id"] = admin_user_id
        config = StoreConfig(**new_data)
        db.add(config)
        await db.commit()
        await db.refresh(config)
        return config

    # Merge current values with updates, then create a new version row
    new_data = {}
    for col in current.__table__.columns:
        if col.name in ("id", "created_at", "updated_at"):
            continue
        new_data[col.name] = getattr(current, col.name)

    for key, value in updates.items():
        if value is not None:
            new_data[key] = value

    new_data["version"] = current.version + 1
    new_data["is_active"] = True
    new_data["created_by_user_id"] = admin_user_id

    current.is_active = False
    new_config = StoreConfig(**new_data)
    db.add(new_config)
    await db.commit()
    await db.refresh(new_config)
    return new_config


async def rollback_config(db: AsyncSession, version: int, admin_user_id) -> StoreConfig:
    result = await db.execute(select(StoreConfig).where(StoreConfig.version == version))
    target = result.scalar_one_or_none()
    if not target:
        raise AppError(ErrorCode.CONFIG_VERSION_NOT_FOUND, f"Config version {version} not found.", status_code=404)

    # Deactivate current active
    current_result = await db.execute(select(StoreConfig).where(StoreConfig.is_active.is_(True)))
    current = current_result.scalar_one_or_none()
    if current:
        current.is_active = False

    # Get highest version
    all_versions = await db.execute(select(StoreConfig.version))
    max_version = max((r[0] for r in all_versions.all()), default=0)

    # Create new version row with rolled-back data
    new_data = {}
    for col in target.__table__.columns:
        if col.name in ("id", "created_at", "updated_at"):
            continue
        new_data[col.name] = getattr(target, col.name)

    new_data["version"] = max_version + 1
    new_data["is_active"] = True
    new_data["created_by_user_id"] = admin_user_id

    new_config = StoreConfig(**new_data)
    db.add(new_config)
    await db.commit()
    await db.refresh(new_config)
    return new_config
