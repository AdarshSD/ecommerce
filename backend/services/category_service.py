import re
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorCode
from core.exceptions import AppError
from models.category import Category
from models.product import ProductCategoryLink


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")


async def _unique_slug(db: AsyncSession, base: str, exclude_id: uuid.UUID | None = None) -> str:
    slug = base
    counter = 2
    while True:
        q = select(Category).where(Category.slug == slug)
        if exclude_id:
            q = q.where(Category.id != exclude_id)
        existing = (await db.execute(q)).scalar_one_or_none()
        if not existing:
            return slug
        slug = f"{base}-{counter}"
        counter += 1


async def _with_product_count(db: AsyncSession, categories: list[Category]) -> list[dict]:
    ids = [c.id for c in categories]
    counts_q = (
        select(ProductCategoryLink.category_id, func.count().label("cnt"))
        .where(ProductCategoryLink.category_id.in_(ids))
        .group_by(ProductCategoryLink.category_id)
    )
    counts = {row.category_id: row.cnt for row in (await db.execute(counts_q)).all()}
    result = []
    for cat in categories:
        d = {col.name: getattr(cat, col.name) for col in cat.__table__.columns}
        d["product_count"] = counts.get(cat.id, 0)
        result.append(d)
    return result


async def list_categories(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Category).where(Category.is_active.is_(True)).order_by(Category.display_order)
    )
    categories = list(result.scalars().all())
    return await _with_product_count(db, categories)


async def list_all_categories(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Category).order_by(Category.display_order))
    categories = list(result.scalars().all())
    return await _with_product_count(db, categories)


async def get_category(db: AsyncSession, category_id: uuid.UUID) -> Category:
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise AppError(ErrorCode.CATEGORY_NOT_FOUND, "Category not found.", status_code=404)
    return cat


async def create_category(db: AsyncSession, name: str, description: str | None, display_order: int, image_url: str | None) -> Category:
    slug = await _unique_slug(db, _slugify(name))
    cat = Category(name=name.strip(), slug=slug, description=description, display_order=display_order, image_url=image_url)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


async def update_category(db: AsyncSession, category_id: uuid.UUID, data: dict) -> Category:
    cat = await get_category(db, category_id)
    if "name" in data and data["name"]:
        data["slug"] = await _unique_slug(db, _slugify(data["name"]), exclude_id=category_id)
    for field, value in data.items():
        if value is not None:
            setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return cat


async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> None:
    cat = await get_category(db, category_id)
    linked = (await db.execute(
        select(ProductCategoryLink).where(ProductCategoryLink.category_id == category_id).limit(1)
    )).scalar_one_or_none()
    if linked:
        raise AppError(ErrorCode.CATEGORY_HAS_PRODUCTS, "Cannot delete a category that has products assigned.", status_code=409)
    cat.is_active = False
    await db.commit()
