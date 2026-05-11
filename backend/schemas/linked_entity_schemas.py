import uuid

from pydantic import BaseModel, field_validator


class LinkedEntityResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    name: str
    bio: str | None
    profile_image_url: str | None
    product_count: int = 0


class CreateLinkedEntityRequest(BaseModel):
    name: str
    bio: str | None = None
    profile_image_url: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank.")
        return v


class UpdateLinkedEntityRequest(BaseModel):
    name: str | None = None
    bio: str | None = None
    profile_image_url: str | None = None
