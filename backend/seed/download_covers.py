"""Downloads cover images from Open Library by ISBN and saves to media/covers/."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import aiohttp
from pathlib import Path
from sqlalchemy import select
from core.config import settings
from core.database import AsyncSessionLocal
from models.product import Product

OPEN_LIBRARY_COVER = "https://covers.openlibrary.org/b/isbn/{isbn}-{size}.jpg"
SIZES = {"thumbnail": "S", "card": "M", "full": "L"}


async def _download(session: aiohttp.ClientSession, url: str, dest: Path) -> bool:
    try:
        async with session.get(url, allow_redirects=True, timeout=aiohttp.ClientTimeout(total=15)) as resp:
            if resp.status == 200:
                data = await resp.read()
                if len(data) > 1000:  # reject 1x1 pixel "no cover" placeholders
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(data)
                    return True
    except Exception:
        pass
    return False


def _svg_placeholder(dest: Path, title: str) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="150" height="220"><rect width="150" height="220" fill="#e2ede8"/><text x="75" y="110" text-anchor="middle" font-size="12" fill="#5a6a60">{title[:20]}</text></svg>')


async def download_covers() -> None:
    media_root = Path(settings.MEDIA_ROOT)
    base_url = settings.MEDIA_BASE_URL.rstrip("/")

    async with AsyncSessionLocal() as db:
        products = list((await db.execute(select(Product).where(Product.isbn.isnot(None)))).scalars().all())
        print(f"Downloading covers for {len(products)} books...")

        async with aiohttp.ClientSession() as session:
            for product in products:
                isbn = product.isbn
                urls = {}
                for size_name, ol_size in SIZES.items():
                    filename = f"covers/{isbn}/{size_name}.jpg"
                    dest = media_root / filename
                    url = OPEN_LIBRARY_COVER.format(isbn=isbn, size=ol_size)
                    ok = await _download(session, url, dest)
                    if ok:
                        urls[size_name] = f"{base_url}/{filename}"
                    else:
                        placeholder = media_root / f"covers/{isbn}/{size_name}.svg"
                        _svg_placeholder(placeholder, product.title)
                        urls[size_name] = f"{base_url}/covers/{isbn}/{size_name}.svg"

                product.cover_thumbnail_url = urls["thumbnail"]
                product.cover_image_url = urls["card"]
                product.cover_full_url = urls["full"]
                await db.flush()
                status = "✓" if ".jpg" in urls["card"] else "✗ (placeholder)"
                print(f"  {status} {product.title[:50]}")

        await db.commit()
        print("Cover download complete.")


if __name__ == "__main__":
    asyncio.run(download_covers())
