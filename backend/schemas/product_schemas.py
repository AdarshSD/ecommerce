import uuid
from datetime import date, datetime

from pydantic import BaseModel, field_validator


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
    format: str | None
    cover_image_url: str | None
    cover_thumbnail_url: str | None
    is_in_stock: bool
    is_featured: bool
    is_bestseller: bool
    is_recommended: bool
    bestseller_rank: int | None
    published_at: date | None
    created_at: datetime


class ProductDetail(ProductSummary):
    description: str | None
    page_count: int | None
    language: str
    publisher: str | None
    cover_full_url: str | None
    categories: list[CategoryBrief] = []
    linked_entities: list[LinkedEntityBrief] = []


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
    price: float
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
    bestseller_rank: int | None = None
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
    price: float | None = None
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
    bestseller_rank: int | None = None
    cost_price: float | None = None
    weight_grams: int | None = None
    supplier: str | None = None
    category_ids: list[uuid.UUID] | None = None
    entity_ids: list[uuid.UUID] | None = None
