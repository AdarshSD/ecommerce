import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, computed_field, field_validator


class CategoryBrief(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    name: str
    slug: str


class LinkedEntityBrief(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    name: str
    profile_image_url: str | None


class ProductSummary(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    title: str
    isbn: str | None
    price: float
    original_price: float | None
    rating: float | None
    reviews_count: int
    format: str | None
    cover_image_url: str | None
    cover_thumbnail_url: str | None
    is_in_stock: bool
    is_featured: bool
    is_bestseller: bool
    is_recommended: bool
    is_new_arrival: bool
    bestseller_rank: int | None
    badge: str | None
    tags: list[Any]
    published_at: date | None
    created_at: datetime
    categories: list[CategoryBrief] = []
    linked_entities: list[LinkedEntityBrief] = []

    @computed_field
    @property
    def year(self) -> int | None:
        return self.published_at.year if self.published_at else None

    @computed_field
    @property
    def pages(self) -> int | None:
        return None  # populated in ProductDetail which has page_count

    @computed_field
    @property
    def primary_author(self) -> str | None:
        if self.linked_entities:
            return self.linked_entities[0].name
        return None

    @computed_field
    @property
    def primary_genre(self) -> str | None:
        if self.categories:
            return self.categories[0].name
        return None


class ProductDetail(ProductSummary):
    description: str | None
    long_description: str | None
    page_count: int | None
    language: str
    publisher: str | None
    cover_full_url: str | None

    @computed_field
    @property
    def pages(self) -> int | None:
        return self.page_count


class AdminProductResponse(ProductDetail):
    cost_price: float | None
    supplier: str | None
    weight_grams: int | None
    stock_count: int
    low_stock_threshold: int
    units_sold_30d: int
    is_deleted: bool
    deleted_at: datetime | None


class CreateProductRequest(BaseModel):
    title: str
    isbn: str | None = None
    description: str | None = None
    long_description: str | None = None
    price: float
    original_price: float | None = None
    format: str | None = None
    page_count: int | None = None
    language: str = "en"
    publisher: str | None = None
    published_at: date | None = None
    cover_image_url: str | None = None
    cover_thumbnail_url: str | None = None
    cover_full_url: str | None = None
    stock_count: int = 0
    low_stock_threshold: int = 5
    is_featured: bool = False
    is_recommended: bool = False
    is_bestseller: bool = False
    is_new_arrival: bool = False
    bestseller_rank: int | None = None
    rating: float | None = None
    reviews_count: int = 0
    badge: str | None = None
    tags: list[str] = []
    cost_price: float | None = None
    weight_grams: int | None = None
    supplier: str | None = None
    category_ids: list[uuid.UUID] = []
    entity_ids: list[uuid.UUID] = []

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than 0.")
        return v


class UpdateProductRequest(BaseModel):
    title: str | None = None
    isbn: str | None = None
    description: str | None = None
    long_description: str | None = None
    price: float | None = None
    original_price: float | None = None
    format: str | None = None
    page_count: int | None = None
    language: str | None = None
    publisher: str | None = None
    published_at: date | None = None
    cover_image_url: str | None = None
    cover_thumbnail_url: str | None = None
    cover_full_url: str | None = None
    stock_count: int | None = None
    low_stock_threshold: int | None = None
    is_featured: bool | None = None
    is_recommended: bool | None = None
    is_bestseller: bool | None = None
    is_new_arrival: bool | None = None
    bestseller_rank: int | None = None
    rating: float | None = None
    reviews_count: int | None = None
    badge: str | None = None
    tags: list[str] | None = None
    cost_price: float | None = None
    weight_grams: int | None = None
    supplier: str | None = None
    category_ids: list[uuid.UUID] | None = None
    entity_ids: list[uuid.UUID] | None = None
