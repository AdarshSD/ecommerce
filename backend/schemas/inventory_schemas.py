import uuid
from datetime import datetime

from pydantic import BaseModel


class InventoryProductRow(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    title: str
    isbn: str | None
    stock_count: int
    low_stock_threshold: int
    is_in_stock: bool
    cover_thumbnail_url: str | None


class InventoryLogEntry(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    old_stock: int
    new_stock: int
    change_reason: str
    reason_detail: str | None
    changed_by_user_id: uuid.UUID | None
    order_id: uuid.UUID | None
    created_at: datetime


class UpdateStockRequest(BaseModel):
    stock_count: int
    low_stock_threshold: int | None = None
    reason: str | None = None


class UpdateOrderStatusRequest(BaseModel):
    status: str
    tracking_number: str | None = None
