import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from background.notifications import send_password_reset_email
from core.config import settings
from core.constants import ErrorCode, Role
from core.exceptions import AppError
from core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password_timing_safe,
)
from models.cart import Cart, CartItem
from models.user import PasswordResetToken, RefreshToken, User


async def _get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def _detect_cart_conflict(
    db: AsyncSession,
    guest_session_token: str | None,
    user_id: uuid.UUID,
) -> dict | None:
    """Returns conflict payload if both guest and user carts have items, else None."""
    if not guest_session_token:
        return None

    guest_result = await db.execute(
        select(Cart)
        .where(Cart.session_token == guest_session_token)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    guest_cart = guest_result.scalar_one_or_none()
    if not guest_cart or not guest_cart.items:
        return None

    user_result = await db.execute(
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    user_cart = user_result.scalar_one_or_none()
    if not user_cart or not user_cart.items:
        # Guest has items, user cart is empty — simple transfer, no conflict prompt needed
        return None

    return {
        "guest_items": [
            {
                "product_id": item.product_id,
                "title": item.product.title,
                "quantity": item.quantity,
                "price": float(item.product.price),
            }
            for item in guest_cart.items
        ],
        "user_items": [
            {
                "product_id": item.product_id,
                "title": item.product.title,
                "quantity": item.quantity,
                "price": float(item.product.price),
            }
            for item in user_cart.items
        ],
    }


async def register(
    db: AsyncSession,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    guest_session_token: str | None = None,
) -> tuple[User, str]:
    existing = await _get_user_by_email(db, email)
    if existing:
        raise AppError(ErrorCode.EMAIL_ALREADY_EXISTS, "An account with this email already exists.", status_code=409)

    user = User(
        email=email,
        password_hash=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        role=Role.CUSTOMER,
    )
    db.add(user)
    await db.flush()

    access_token = create_access_token(str(user.id), user.role)
    await db.commit()
    await db.refresh(user)
    return user, access_token


async def login(
    db: AsyncSession,
    email: str,
    password: str,
    guest_session_token: str | None = None,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[User, str, str, dict | None]:
    user = await _get_user_by_email(db, email)

    # Always run bcrypt even when user is not found — prevents timing attacks
    valid = verify_password_timing_safe(password, user.password_hash if user else None)

    if not user or not valid:
        raise AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password.", status_code=401)

    if not user.is_active:
        raise AppError(ErrorCode.ACCOUNT_INACTIVE, "This account has been deactivated.", status_code=403)

    raw_refresh = generate_refresh_token()
    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(refresh_record)
    user.last_login_at = datetime.now(timezone.utc)

    await db.flush()
    cart_conflict = await _detect_cart_conflict(db, guest_session_token, user.id)
    access_token = create_access_token(str(user.id), user.role)

    await db.commit()
    await db.refresh(user)
    return user, access_token, raw_refresh, cart_conflict


async def refresh_access_token(
    db: AsyncSession,
    raw_token: str,
) -> tuple[User, str, str]:
    token_hash = hash_token(raw_token)
    result = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.token_hash == token_hash, RefreshToken.revoked_at.is_(None))
        .options(selectinload(RefreshToken.user))
    )
    record = result.scalar_one_or_none()

    if not record:
        raise AppError(ErrorCode.SESSION_EXPIRED, "Session expired. Please log in again.", status_code=401)

    if record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise AppError(ErrorCode.SESSION_EXPIRED, "Session expired. Please log in again.", status_code=401)

    # Rotate: revoke old, issue new
    record.revoked_at = datetime.now(timezone.utc)
    new_raw = generate_refresh_token()
    db.add(RefreshToken(
        user_id=record.user_id,
        token_hash=hash_token(new_raw),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    ))

    access_token = create_access_token(str(record.user.id), record.user.role)
    await db.commit()
    return record.user, access_token, new_raw


async def logout(db: AsyncSession, raw_token: str, logout_all: bool = False) -> None:
    token_hash = hash_token(raw_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    record = result.scalar_one_or_none()
    if not record:
        return  # Already logged out — silently succeed

    now = datetime.now(timezone.utc)
    if logout_all:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == record.user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
    else:
        record.revoked_at = now

    await db.commit()


async def forgot_password(db: AsyncSession, email: str) -> None:
    user = await _get_user_by_email(db, email)

    # Always return success regardless — no user enumeration
    if not user or not user.is_active:
        return

    # Invalidate any existing unused tokens
    existing = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
    )
    for old in existing.scalars().all():
        old.used_at = datetime.now(timezone.utc)

    raw_token = generate_refresh_token()
    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    ))
    await db.commit()

    send_password_reset_email(user.email, raw_token)  # [P3-EMAIL] stub


async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> None:
    token_hash = hash_token(raw_token)
    result = await db.execute(
        select(PasswordResetToken)
        .where(PasswordResetToken.token_hash == token_hash, PasswordResetToken.used_at.is_(None))
        .options(selectinload(PasswordResetToken.user))
    )
    record = result.scalar_one_or_none()

    if not record:
        raise AppError(ErrorCode.INVALID_TOKEN, "Reset link is invalid or has already been used.", status_code=400)

    if record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise AppError(ErrorCode.TOKEN_EXPIRED, "Reset link has expired. Please request a new one.", status_code=400)

    record.used_at = datetime.now(timezone.utc)
    record.user.password_hash = hash_password(new_password)

    # Revoke all sessions so the user must log in fresh
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == record.user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(timezone.utc))
    )
    await db.commit()
