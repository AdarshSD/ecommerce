import uuid
from datetime import datetime

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    address_id: uuid.UUID
    notes: str | None = None


class OrderItemResponse(BaseModel):
    model_config = {"from_attributes": True}
    product_id: uuid.UUID
    title: str
    quantity: int
    unit_price: float
    line_total: float


class OrderResponse(BaseModel):
    id: uuid.UUID
    status: str
    subtotal: float
    shipping_cost: float
    tax: float
    total: float
    currency: str
    payment_reference: str | None
    payment_status: str
    tracking_number: str | None
    notes: str | None
    created_at: datetime
    items: list[OrderItemResponse] = []
