import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, TimestampMixin, UUIDPrimaryKey


class StoreConfig(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "store_configs"

    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    store_name: Mapped[str] = mapped_column(String(200), nullable=False)
    store_tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    primary_colour: Mapped[str] = mapped_column(String(7), nullable=False, default="#1a3a2a")
    secondary_colour: Mapped[str] = mapped_column(String(7), nullable=False, default="#2d6a4f")
    accent_colour: Mapped[str] = mapped_column(String(7), nullable=False, default="#52b788")
    background_colour: Mapped[str] = mapped_column(String(7), nullable=False, default="#f8f9f6")
    surface_colour: Mapped[str] = mapped_column(String(7), nullable=False, default="#ffffff")
    text_primary_colour: Mapped[str] = mapped_column(String(7), nullable=False, default="#1a1a1a")
    text_secondary_colour: Mapped[str] = mapped_column(String(7), nullable=False, default="#5a6a60")
    border_colour: Mapped[str] = mapped_column(String(7), nullable=False, default="#e2ede8")
    font_family: Mapped[str] = mapped_column(String(100), nullable=False, default="Plus Jakarta Sans")

    hero_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    hero_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    hero_subtitle: Mapped[str | None] = mapped_column(String(500), nullable=True)

    homepage_sections: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    currency_code: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    currency_symbol: Mapped[str] = mapped_column(String(5), nullable=False, default="$")

    product_type_label: Mapped[str] = mapped_column(String(100), nullable=False, default="Book")
    product_type_label_plural: Mapped[str] = mapped_column(String(100), nullable=False, default="Books")
    linked_entity_label: Mapped[str] = mapped_column(String(100), nullable=False, default="Author")
    linked_entity_label_plural: Mapped[str] = mapped_column(String(100), nullable=False, default="Authors")
    category_label: Mapped[str] = mapped_column(String(100), nullable=False, default="Genre")
    category_label_plural: Mapped[str] = mapped_column(String(100), nullable=False, default="Genres")

    support_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    footer_links: Mapped[list | None] = mapped_column(JSON, nullable=True)
    social_links: Mapped[list | None] = mapped_column(JSON, nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    shipping_policy: Mapped[str | None] = mapped_column(Text, nullable=True)
    return_policy: Mapped[str | None] = mapped_column(Text, nullable=True)

    tax_rate: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False, default=0.0)
    flat_shipping_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    free_shipping_threshold: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
