from datetime import datetime

from sqlalchemy import Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDPrimaryKey


class LinkedEntity(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "linked_entities"

    name: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    product_links: Mapped[list["ProductEntityLink"]] = relationship(back_populates="entity")  # type: ignore[name-defined]
