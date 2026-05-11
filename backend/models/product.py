import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDPrimaryKey


class Product(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "products"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    isbn: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    cost_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    format: Mapped[str | None] = mapped_column(String(30), nullable=True)       # [P4: product_attributes]
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)       # [P4: product_attributes]
    language: Mapped[str] = mapped_column(String(5), nullable=False, default="en")
    publisher: Mapped[str | None] = mapped_column(String(200), nullable=True)   # [P4: product_attributes]
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_full_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    stock_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    is_in_stock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    is_recommended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_bestseller: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    bestseller_rank: Mapped[int | None] = mapped_column(Integer, nullable=True)
    units_sold_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    auto_bestseller: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    weight_grams: Mapped[int | None] = mapped_column(Integer, nullable=True)
    supplier: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    entity_links: Mapped[list["ProductEntityLink"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    category_links: Mapped[list["ProductCategoryLink"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="product")  # type: ignore[name-defined]
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")  # type: ignore[name-defined]
    inventory_logs: Mapped[list["InventoryLog"]] = relationship(back_populates="product")  # type: ignore[name-defined]


class ProductEntityLink(Base):
    __tablename__ = "product_entity_links"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("linked_entities.id", ondelete="RESTRICT"), primary_key=True, index=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    product: Mapped["Product"] = relationship(back_populates="entity_links")
    entity: Mapped["LinkedEntity"] = relationship(back_populates="product_links")  # type: ignore[name-defined]


class ProductCategoryLink(Base):
    __tablename__ = "product_category_links"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), primary_key=True, index=True)

    product: Mapped["Product"] = relationship(back_populates="category_links")
    category: Mapped["Category"] = relationship(back_populates="product_links")  # type: ignore[name-defined]
