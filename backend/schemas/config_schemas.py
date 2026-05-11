import re
import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class HomepageSection(BaseModel):
    id: str
    type: str
    is_visible: bool = True
    display_order: int = 0
    title: str | None = None
    subtitle: str | None = None
    limit: int = 12
    category_id: str | None = None
    entity_id: str | None = None
    sort_by: str | None = None
    filters: dict = {}
    cta_text: str | None = None
    cta_url: str | None = None
    image_url: str | None = None


class StoreConfigPublic(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    version: int
    store_name: str
    store_tagline: str | None
    logo_url: str | None
    favicon_url: str | None
    primary_colour: str
    secondary_colour: str
    accent_colour: str
    background_colour: str
    surface_colour: str
    text_primary_colour: str
    text_secondary_colour: str
    border_colour: str
    font_family: str
    hero_image_url: str | None
    hero_title: str | None
    hero_subtitle: str | None
    homepage_sections: list
    currency_code: str
    currency_symbol: str
    product_type_label: str
    product_type_label_plural: str
    linked_entity_label: str
    linked_entity_label_plural: str
    category_label: str
    category_label_plural: str
    support_email: str | None
    footer_links: list | None
    social_links: list | None
    meta_description: str | None
    shipping_policy: str | None
    return_policy: str | None
    tax_rate: float
    flat_shipping_rate: float
    free_shipping_threshold: float | None


class StoreConfigVersion(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    version: int
    is_active: bool
    store_name: str
    created_at: datetime


_HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")

_COLOUR_FIELDS = {
    "primary_colour", "secondary_colour", "accent_colour", "background_colour",
    "surface_colour", "text_primary_colour", "text_secondary_colour", "border_colour",
}


class UpdateStoreConfigRequest(BaseModel):
    store_name: str | None = None
    store_tagline: str | None = None
    logo_url: str | None = None
    favicon_url: str | None = None
    primary_colour: str | None = None
    secondary_colour: str | None = None
    accent_colour: str | None = None
    background_colour: str | None = None
    surface_colour: str | None = None
    text_primary_colour: str | None = None
    text_secondary_colour: str | None = None
    border_colour: str | None = None
    font_family: str | None = None
    hero_image_url: str | None = None
    hero_title: str | None = None
    hero_subtitle: str | None = None
    homepage_sections: list | None = None
    currency_code: str | None = None
    currency_symbol: str | None = None
    product_type_label: str | None = None
    product_type_label_plural: str | None = None
    linked_entity_label: str | None = None
    linked_entity_label_plural: str | None = None
    category_label: str | None = None
    category_label_plural: str | None = None
    support_email: str | None = None
    footer_links: list | None = None
    social_links: list | None = None
    meta_description: str | None = None
    shipping_policy: str | None = None
    return_policy: str | None = None
    tax_rate: float | None = None
    flat_shipping_rate: float | None = None
    free_shipping_threshold: float | None = None

    @field_validator("primary_colour", "secondary_colour", "accent_colour", "background_colour",
                     "surface_colour", "text_primary_colour", "text_secondary_colour", "border_colour")
    @classmethod
    def valid_hex(cls, v: str | None) -> str | None:
        if v is not None and not _HEX_RE.match(v):
            raise ValueError("Colour must be a 6-digit hex value e.g. #1a3a2a")
        return v
