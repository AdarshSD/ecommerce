from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Meta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class Response(BaseModel, Generic[T]):
    data: T
    meta: Meta | None = None


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, str] | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
