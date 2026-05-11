import os
from pathlib import Path

import aiofiles

from core.config import settings


class LocalStorageService:
    def __init__(self) -> None:
        self.media_root = Path(settings.MEDIA_ROOT)
        self.base_url = settings.MEDIA_BASE_URL.rstrip("/")

    async def save(self, file_bytes: bytes, key: str, content_type: str = "application/octet-stream") -> str:
        dest = self.media_root / key
        dest.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(dest, "wb") as f:
            await f.write(file_bytes)
        return self.get_url(key)

    def get_url(self, key: str) -> str:
        return f"{self.base_url}/{key}"

    async def delete(self, key: str) -> bool:
        path = self.media_root / key
        if path.exists():
            path.unlink()
            return True
        return False

    async def exists(self, key: str) -> bool:
        return (self.media_root / key).exists()


def get_storage() -> LocalStorageService:
    # [P3] swap to CloudStorageService based on settings.STORAGE_BACKEND
    return LocalStorageService()


storage = get_storage()
