import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    profile_image_url: str | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("This field cannot be blank.")
        return v


class AddressRequest(BaseModel):
    full_name: str
    line_1: str
    line_2: str | None = None
    city: str
    county: str | None = None
    postcode: str
    country_code: str = "US"
    phone_number: str | None = None
    is_default: bool = False

    @field_validator("country_code")
    @classmethod
    def two_char(cls, v: str) -> str:
        v = v.upper().strip()
        if len(v) != 2:
            raise ValueError("country_code must be a 2-letter ISO code.")
        return v


class UpdateAddressRequest(BaseModel):
    full_name: str | None = None
    line_1: str | None = None
    line_2: str | None = None
    city: str | None = None
    county: str | None = None
    postcode: str | None = None
    country_code: str | None = None
    phone_number: str | None = None
    is_default: bool | None = None


class AddressResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    full_name: str
    line_1: str
    line_2: str | None
    city: str
    county: str | None
    postcode: str
    country_code: str
    phone_number: str | None
    is_default: bool
    created_at: datetime
