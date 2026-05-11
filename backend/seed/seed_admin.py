"""Creates the first SUPER_ADMIN user from environment variables."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from core.config import settings
from core.database import AsyncSessionLocal
from core.security import hash_password
from core.constants import Role
from models.user import User


async def seed_admin() -> None:
    if not settings.FIRST_ADMIN_EMAIL or not settings.FIRST_ADMIN_PASSWORD:
        print("ERROR: FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD must be set in .env")
        return

    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == settings.FIRST_ADMIN_EMAIL))).scalar_one_or_none()
        if existing:
            print(f"Admin already exists: {settings.FIRST_ADMIN_EMAIL} (role={existing.role})")
            existing.role = Role.SUPER_ADMIN
            await db.commit()
            print(f"Role updated to SUPER_ADMIN.")
            return

        admin = User(
            email=settings.FIRST_ADMIN_EMAIL,
            password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD),
            first_name=settings.FIRST_ADMIN_FIRST_NAME,
            last_name=settings.FIRST_ADMIN_LAST_NAME,
            role=Role.SUPER_ADMIN,
            is_active=True,
            is_email_verified=True,
        )
        db.add(admin)
        await db.commit()
        print(f"Created SUPER_ADMIN: {settings.FIRST_ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
