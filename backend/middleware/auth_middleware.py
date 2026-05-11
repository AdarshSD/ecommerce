import uuid

from fastapi import Depends, Header, HTTPException
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorCode, Role
from core.database import get_db
from core.security import decode_access_token
from models.user import User


def _auth_error(code: ErrorCode, message: str, status_code: int = 401) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message},
    )


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise _auth_error(ErrorCode.AUTHENTICATION_REQUIRED, "Authentication required.")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise _auth_error(ErrorCode.INVALID_TOKEN, "Invalid token.")
    except JWTError:
        raise _auth_error(ErrorCode.TOKEN_EXPIRED, "Token expired or invalid.")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise _auth_error(ErrorCode.AUTHENTICATION_REQUIRED, "Authentication required.")
    if not user.is_active:
        raise _auth_error(ErrorCode.ACCOUNT_INACTIVE, "Account is deactivated.", status_code=403)

    return user


async def get_optional_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await get_current_user(authorization, db)
    except HTTPException:
        return None


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in (Role.ADMIN, Role.SUPER_ADMIN):
        raise HTTPException(
            status_code=403,
            detail={"code": ErrorCode.FORBIDDEN, "message": "Admin access required."},
        )
    return user
