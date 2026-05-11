from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

import services.auth_service as auth_service
from core.constants import ErrorCode
from core.database import get_db
from core.exceptions import AppError
from schemas.auth_schemas import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

_REFRESH_COOKIE = "refresh_token"
_GUEST_COOKIE = "guest_session_token"
_REFRESH_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=raw_token,
        httponly=True,
        samesite="lax",
        secure=False,   # [P3] True in production (HTTPS only)
        max_age=_REFRESH_MAX_AGE,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(_REFRESH_COOKIE, path="/")


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.post(
    "/register",
    summary="Register a new customer account",
    description="Creates a CUSTOMER account. Email must be unique. Returns an access token immediately.",
    status_code=201,
)
async def register(
    body: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    guest_token = request.cookies.get(_GUEST_COOKIE)
    try:
        user, access_token = await auth_service.register(
            db, body.email, body.password, body.first_name, body.last_name, guest_token
        )
    except AppError as e:
        _raise(e)

    return AuthResponse(
        data=TokenResponse(access_token=access_token, user=UserResponse.model_validate(user)),
        cart_conflict=None,
    )


@router.post(
    "/login",
    summary="Log in and receive access + refresh tokens",
    description="""
    Authenticates with email and password. Returns a short-lived access token in the response
    body and a long-lived refresh token in an httpOnly cookie.

    If the request contains a `guest_session_token` cookie AND both the guest cart and the
    user's existing cart have items, a `cart_conflict` payload is returned so the frontend
    can prompt the user to choose a merge strategy.
    """,
)
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    guest_token = request.cookies.get(_GUEST_COOKIE)
    try:
        user, access_token, raw_refresh, cart_conflict = await auth_service.login(
            db,
            body.email,
            body.password,
            guest_token,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
        )
    except AppError as e:
        _raise(e)

    _set_refresh_cookie(response, raw_refresh)
    return AuthResponse(
        data=TokenResponse(access_token=access_token, user=UserResponse.model_validate(user)),
        cart_conflict=cart_conflict,
    )


@router.post(
    "/refresh",
    summary="Refresh the access token",
    description="Reads the `refresh_token` httpOnly cookie, validates it, rotates it, and returns a new access token.",
)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    raw_token = request.cookies.get(_REFRESH_COOKIE)
    if not raw_token:
        raise HTTPException(
            status_code=401,
            detail={"code": ErrorCode.NO_REFRESH_TOKEN, "message": "No refresh token present."},
        )
    try:
        _, access_token, new_raw = await auth_service.refresh_access_token(db, raw_token)
    except AppError as e:
        _raise(e)

    _set_refresh_cookie(response, new_raw)
    return {"data": {"access_token": access_token, "token_type": "bearer"}, "meta": None}


@router.post(
    "/logout",
    summary="Log out — revoke refresh token",
    description="Revokes the current session. Pass `?logout_all=true` to revoke all devices.",
)
async def logout(
    request: Request,
    response: Response,
    logout_all: bool = Query(False),
    db: AsyncSession = Depends(get_db),
) -> dict:
    raw_token = request.cookies.get(_REFRESH_COOKIE)
    if raw_token:
        await auth_service.logout(db, raw_token, logout_all)
    _clear_refresh_cookie(response)
    return {"data": {"detail": "Logged out successfully."}, "meta": None}


@router.post(
    "/forgot-password",
    summary="Request a password reset",
    description="Always returns 200 regardless of whether the email exists — prevents user enumeration.",
)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    await auth_service.forgot_password(db, body.email)
    return {"data": {"detail": "If an account with that email exists, a reset link has been sent."}, "meta": None}


@router.post(
    "/reset-password",
    summary="Reset password using a valid token",
    description="Single-use token with 1-hour TTL. All active sessions are revoked on success.",
)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        await auth_service.reset_password(db, body.token, body.new_password)
    except AppError as e:
        _raise(e)
    return {"data": {"detail": "Password reset successfully. Please log in."}, "meta": None}
