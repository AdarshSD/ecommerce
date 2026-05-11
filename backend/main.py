import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings

app = FastAPI(
    title="Leaf & Lore API",
    description="White-label e-commerce platform — Leaf & Lore bookstore demo",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local media files at /media (P1/P2 — replaced by CDN in P3)
os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

# Register all models with SQLAlchemy before any router imports them
import models  # noqa: F401, E402

# Routers
from api.auth import router as auth_router  # noqa: E402
from api.users import router as users_router  # noqa: E402

app.include_router(auth_router)
app.include_router(users_router)


@app.get("/health", tags=["Health"], summary="Health check")
async def health() -> dict:
    return {"status": "ok"}
