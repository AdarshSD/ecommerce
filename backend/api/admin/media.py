import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from middleware.auth_middleware import require_admin
from services.storage_service import storage

router = APIRouter(prefix="/api/admin/media", tags=["Admin - Media"])

_ALLOWED = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post(
    "/upload",
    summary="Upload a media file",
    description=(
        "Accepts JPEG, PNG, or WebP under 5 MB. Returns the public URL. Admin only. "
        "Pass `storage_key` to control the save path (e.g. `covers/9780000000000/card.jpg`); "
        "omit to auto-generate a path under `uploads/`."
    ),
)
async def upload_media(
    file: UploadFile = File(...),
    storage_key: str | None = Form(None),
    _: dict = Depends(require_admin),
) -> dict:
    if file.content_type not in _ALLOWED:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    data = await file.read()
    if len(data) > _MAX_BYTES:
        raise HTTPException(status_code=400, detail="File must be under 5 MB.")

    ext = (file.filename or "image").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"

    key = storage_key if storage_key else f"uploads/{uuid.uuid4()}.{ext}"
    url = await storage.save(data, key, file.content_type or "image/jpeg")
    return {"url": url}
