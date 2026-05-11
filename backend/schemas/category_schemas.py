import uuid

from pydantic import BaseModel, field_validator


class CategoryResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    image_url: str | None
    display_order: int
    is_active: bool
    product_count: int = 0


class CreateCategoryRequest(BaseModel):
    name: str
    description: str | None = None
    display_order: int = 0
    image_url: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank.")
        return v


class UpdateCategoryRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    display_order: int | None = None
    image_url: str | None = None
    is_active: bool | None = None
