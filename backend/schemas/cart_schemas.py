import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from core.constants import CartMergeStrategy


class CartItemResponse(BaseModel):
    product_id: uuid.UUID
    title: str
    cover_thumbnail_url: str | None
    quantity: int
    unit_price: float
    price_at_add: float
    line_total: float
    is_in_stock: bool
    stock_count: int


class CartResponse(BaseModel):
    id: uuid.UUID
    items: list[CartItemResponse]
    subtotal: float
    item_count: int
    requires_login_for_checkout: bool


class AddItemRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1.")
        return v


class UpdateItemRequest(BaseModel):
    quantity: int


class MergeCartRequest(BaseModel):
    strategy: CartMergeStrategy
