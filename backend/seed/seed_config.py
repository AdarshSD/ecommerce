"""Seeds the three store themes. Leaf & Lore is set as active."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from core.database import AsyncSessionLocal
from models.config import StoreConfig

LEAF_AND_LORE_SECTIONS = [
    {"id": "section-hero",        "type": "hero",        "is_visible": True,  "display_order": 1, "title": "Leaf & Lore", "subtitle": "Stories rooted in every page", "limit": 0},
    {"id": "section-featured",    "type": "featured",    "is_visible": True,  "display_order": 2, "title": "Staff Picks", "subtitle": "Handpicked by our team", "limit": 12},
    {"id": "section-bestsellers", "type": "bestseller",  "is_visible": True,  "display_order": 3, "title": "Bestsellers", "subtitle": "Our most loved titles", "limit": 12},
    {"id": "section-new",         "type": "new_arrivals","is_visible": True,  "display_order": 4, "title": "New Arrivals", "subtitle": "Just landed", "limit": 12},
    {"id": "section-categories",  "type": "categories",  "is_visible": True,  "display_order": 5, "title": "Browse by Genre", "limit": 0},
    {"id": "section-spotlight",   "type": "category",    "is_visible": False, "display_order": 6, "title": "Category Spotlight", "limit": 8, "category_id": None},
]

LEAF_CONFIG = dict(
    store_name="Leaf & Lore", store_tagline="Stories rooted in every page",
    primary_colour="#1a3a2a", secondary_colour="#2d6a4f", accent_colour="#52b788",
    background_colour="#f8f9f6", surface_colour="#ffffff", text_primary_colour="#1a1a1a",
    text_secondary_colour="#5a6a60", border_colour="#e2ede8", font_family="Plus Jakarta Sans",
    hero_title="Stories rooted in every page", hero_subtitle="Discover your next great read",
    homepage_sections=LEAF_AND_LORE_SECTIONS,
    product_type_label="Book", product_type_label_plural="Books",
    linked_entity_label="Author", linked_entity_label_plural="Authors",
    category_label="Genre", category_label_plural="Genres",
    shipping_policy="Standard shipping 3–5 business days. Free shipping on orders over $50.",
    return_policy="30-day returns on all items in original condition.",
    support_email="hello@leafandlore.com", currency_code="USD", currency_symbol="$",
    tax_rate=0.0, flat_shipping_rate=4.99, free_shipping_threshold=50.0,
    version=1, is_active=True,
)

MIDNIGHT_CONFIG = dict(
    store_name="Leaf & Lore", store_tagline="Stories rooted in every page",
    primary_colour="#000000", secondary_colour="#1d1d1f", accent_colour="#0071e3",
    background_colour="#000000", surface_colour="#1d1d1f", text_primary_colour="#f5f5f7",
    text_secondary_colour="#a1a1a6", border_colour="#2d2d2f", font_family="Inter",
    homepage_sections=LEAF_AND_LORE_SECTIONS,
    product_type_label="Book", product_type_label_plural="Books",
    linked_entity_label="Author", linked_entity_label_plural="Authors",
    category_label="Genre", category_label_plural="Genres",
    currency_code="USD", currency_symbol="$", tax_rate=0.0,
    flat_shipping_rate=4.99, free_shipping_threshold=50.0,
    version=2, is_active=False,
)

NEON_MANGA_CONFIG = dict(
    store_name="Leaf & Lore", store_tagline="Stories rooted in every page",
    primary_colour="#0d0d0d", secondary_colour="#1a0a1a", accent_colour="#ff2d78",
    background_colour="#0d0d0d", surface_colour="#1a1a2e", text_primary_colour="#f0f0f0",
    text_secondary_colour="#a0a0b0", border_colour="#ff2d78", font_family="Syne",
    homepage_sections=LEAF_AND_LORE_SECTIONS,
    product_type_label="Book", product_type_label_plural="Books",
    linked_entity_label="Author", linked_entity_label_plural="Authors",
    category_label="Genre", category_label_plural="Genres",
    currency_code="USD", currency_symbol="$", tax_rate=0.0,
    flat_shipping_rate=4.99, free_shipping_threshold=50.0,
    version=3, is_active=False,
)


async def seed_config() -> None:
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(StoreConfig))).scalars().all()
        if existing:
            print(f"Config already seeded ({len(existing)} versions exist). Skipping.")
            return

        for cfg in [LEAF_CONFIG, MIDNIGHT_CONFIG, NEON_MANGA_CONFIG]:
            db.add(StoreConfig(**cfg))

        await db.commit()
        print("Seeded 3 store config themes. Leaf & Lore is active.")


if __name__ == "__main__":
    asyncio.run(seed_config())
