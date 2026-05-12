import uuid
from datetime import datetime, timezone

from sqlalchemy import desc, func, nulls_last, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.constants import ErrorCode, InventoryChangeReason
from core.exceptions import AppError
from models.category import Category
from models.config import StoreConfig
from models.linked_entity import LinkedEntity
from models.order import InventoryLog
from models.product import Product, ProductCategoryLink, ProductEntityLink


def _base_public_query():
    return select(Product).where(Product.is_deleted.is_(False))


def _apply_sort(q, sort: str):
    if sort == "price_asc":
        return q.order_by(Product.price.asc())
    if sort == "price_desc":
        return q.order_by(Product.price.desc())
    if sort == "bestseller":
        return q.order_by(nulls_last(Product.bestseller_rank.asc()), Product.units_sold_30d.desc())
    if sort == "title_asc":
        return q.order_by(Product.title.asc())
    # default: newest
    return q.order_by(nulls_last(Product.published_at.desc()), Product.created_at.desc())


async def list_products(db: AsyncSession, filters: dict) -> tuple[list[Product], int]:
    q = _base_public_query()

    if filters.get("category_id"):
        q = q.join(ProductCategoryLink, ProductCategoryLink.product_id == Product.id).where(
            ProductCategoryLink.category_id == filters["category_id"]
        ).distinct()

    if filters.get("entity_id"):
        q = q.join(ProductEntityLink, ProductEntityLink.product_id == Product.id).where(
            ProductEntityLink.entity_id == filters["entity_id"]
        ).distinct()

    if filters.get("min_price") is not None:
        q = q.where(Product.price >= filters["min_price"])
    if filters.get("max_price") is not None:
        q = q.where(Product.price <= filters["max_price"])
    if filters.get("format"):
        q = q.where(Product.format == filters["format"])
    if filters.get("in_stock") is not None:
        q = q.where(Product.is_in_stock.is_(filters["in_stock"]))
    if filters.get("is_featured") is not None:
        q = q.where(Product.is_featured.is_(filters["is_featured"]))
    if filters.get("is_recommended") is not None:
        q = q.where(Product.is_recommended.is_(filters["is_recommended"]))
    if filters.get("is_bestseller") is not None:
        q = q.where(Product.is_bestseller.is_(filters["is_bestseller"]))
    if filters.get("is_new_arrival") is not None:
        q = q.where(Product.is_new_arrival.is_(filters["is_new_arrival"]))
    if filters.get("search"):
        q = q.where(Product.title.ilike(f"%{filters['search']}%"))  # [P2] → FTS/Elasticsearch

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()

    page = filters.get("page", 1)
    page_size = filters.get("page_size", 20)
    q = _apply_sort(q, filters.get("sort", "newest"))
    q = q.offset((page - 1) * page_size).limit(page_size)
    q = q.options(
        selectinload(Product.category_links).selectinload(ProductCategoryLink.category),
        selectinload(Product.entity_links).selectinload(ProductEntityLink.entity),
    )

    products = list((await db.execute(q)).scalars().all())
    return products, total


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    result = await db.execute(
        _base_public_query()
        .where(Product.id == product_id)
        .options(
            selectinload(Product.category_links).selectinload(ProductCategoryLink.category),
            selectinload(Product.entity_links).selectinload(ProductEntityLink.entity),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise AppError(ErrorCode.PRODUCT_NOT_FOUND, "Product not found.", status_code=404)
    return product


async def get_section_products(db: AsyncSession, section_id: str) -> list[Product]:
    config_result = await db.execute(
        select(StoreConfig).where(StoreConfig.is_active.is_(True))
    )
    config = config_result.scalar_one_or_none()
    if not config:
        return []

    section = next((s for s in config.homepage_sections if s.get("id") == section_id), None)
    if not section or not section.get("is_visible", True):
        return []

    limit = section.get("limit", 12)
    section_type = section.get("type")
    q = _base_public_query().where(Product.is_in_stock.is_(True))

    if section_type == "featured":
        q = q.where(Product.is_featured.is_(True)).order_by(Product.created_at.desc())
    elif section_type == "bestseller":
        q = q.where(Product.is_bestseller.is_(True)).order_by(nulls_last(Product.bestseller_rank.asc()))
    elif section_type == "new_arrivals":
        q = q.order_by(nulls_last(Product.published_at.desc()), Product.created_at.desc())
    elif section_type == "category" and section.get("category_id"):
        cat_id = uuid.UUID(section["category_id"]) if isinstance(section["category_id"], str) else section["category_id"]
        q = (q.join(ProductCategoryLink, ProductCategoryLink.product_id == Product.id)
               .where(ProductCategoryLink.category_id == cat_id)
               .order_by(Product.created_at.desc()))
    elif section_type == "entity" and section.get("entity_id"):
        ent_id = uuid.UUID(section["entity_id"]) if isinstance(section["entity_id"], str) else section["entity_id"]
        q = (q.join(ProductEntityLink, ProductEntityLink.product_id == Product.id)
               .where(ProductEntityLink.entity_id == ent_id)
               .order_by(Product.created_at.desc()))
    else:
        return []

    sort_by = section.get("sort_by")
    if sort_by:
        q = _apply_sort(select(Product).where(Product.is_deleted.is_(False), Product.is_in_stock.is_(True)), sort_by)

    q = q.limit(limit).options(
        selectinload(Product.category_links).selectinload(ProductCategoryLink.category),
        selectinload(Product.entity_links).selectinload(ProductEntityLink.entity),
    )
    return list((await db.execute(q)).scalars().all())


async def _sync_links(db: AsyncSession, product: Product, category_ids: list[uuid.UUID], entity_ids: list[uuid.UUID]) -> None:
    await db.execute(
        ProductCategoryLink.__table__.delete().where(ProductCategoryLink.product_id == product.id)
    )
    await db.execute(
        ProductEntityLink.__table__.delete().where(ProductEntityLink.product_id == product.id)
    )
    for cat_id in category_ids:
        db.add(ProductCategoryLink(product_id=product.id, category_id=cat_id))
    for order, ent_id in enumerate(entity_ids):
        db.add(ProductEntityLink(product_id=product.id, entity_id=ent_id, display_order=order))


async def create_product(db: AsyncSession, data: dict, admin_user_id: uuid.UUID) -> Product:
    category_ids = data.pop("category_ids", [])
    entity_ids = data.pop("entity_ids", [])

    if data.get("isbn"):
        existing = (await db.execute(select(Product).where(Product.isbn == data["isbn"]))).scalar_one_or_none()
        if existing:
            raise AppError(ErrorCode.ISBN_ALREADY_EXISTS, "A product with this ISBN already exists.", status_code=409)

    stock = data.get("stock_count", 0)
    data["is_in_stock"] = stock > 0

    product = Product(**data)
    db.add(product)
    await db.flush()

    await _sync_links(db, product, category_ids, entity_ids)

    if stock > 0:
        db.add(InventoryLog(
            product_id=product.id,
            changed_by_user_id=admin_user_id,
            old_stock=0,
            new_stock=stock,
            change_reason=InventoryChangeReason.INITIAL_STOCK,
        ))

    await db.commit()
    return await get_product(db, product.id)


async def update_product(db: AsyncSession, product_id: uuid.UUID, data: dict, admin_user_id: uuid.UUID) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product or product.is_deleted:
        raise AppError(ErrorCode.PRODUCT_NOT_FOUND, "Product not found.", status_code=404)

    category_ids = data.pop("category_ids", None)
    entity_ids = data.pop("entity_ids", None)

    old_stock = product.stock_count
    for field, value in data.items():
        if value is not None:
            setattr(product, field, value)

    if "stock_count" in data and data["stock_count"] is not None:
        product.is_in_stock = data["stock_count"] > 0
        if data["stock_count"] != old_stock:
            db.add(InventoryLog(
                product_id=product.id,
                changed_by_user_id=admin_user_id,
                old_stock=old_stock,
                new_stock=data["stock_count"],
                change_reason=InventoryChangeReason.ADMIN_UPDATE,
            ))

    if category_ids is not None:
        await _sync_links(db, product, category_ids, entity_ids or [])
    elif entity_ids is not None:
        await _sync_links(db, product, [], entity_ids)

    await db.commit()
    return await get_product(db, product.id)


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product or product.is_deleted:
        raise AppError(ErrorCode.PRODUCT_NOT_FOUND, "Product not found.", status_code=404)
    product.is_deleted = True
    product.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def list_admin_products(db: AsyncSession, filters: dict) -> tuple[list[Product], int]:
    q = select(Product)
    if not filters.get("include_deleted"):
        q = q.where(Product.is_deleted.is_(False))
    if filters.get("search"):
        q = q.where(Product.title.ilike(f"%{filters['search']}%"))
    if filters.get("category_id"):
        q = q.join(ProductCategoryLink, ProductCategoryLink.product_id == Product.id).where(
            ProductCategoryLink.category_id == filters["category_id"]
        ).distinct()

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    page, page_size = filters.get("page", 1), filters.get("page_size", 20)
    q = q.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    products = list((await db.execute(
        q.options(
            selectinload(Product.category_links).selectinload(ProductCategoryLink.category),
            selectinload(Product.entity_links).selectinload(ProductEntityLink.entity),
        )
    )).scalars().all())
    return products, total
