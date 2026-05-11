import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

import services.cart_service as cart_service
from core.database import get_db
from core.exceptions import AppError
from middleware.auth_middleware import get_optional_user
from models.user import User
from schemas.cart_schemas import AddItemRequest, MergeCartRequest, UpdateItemRequest

router = APIRouter(prefix="/api/cart", tags=["Cart"])

_GUEST_COOKIE = "guest_session_token"
_GUEST_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def _get_session_token(request: Request, response: Response) -> str:
    token = request.cookies.get(_GUEST_COOKIE)
    if not token:
        token = str(uuid.uuid4())
        response.set_cookie(key=_GUEST_COOKIE, value=token, httponly=True, samesite="lax", max_age=_GUEST_MAX_AGE)
    return token


def _raise(e: AppError) -> None:
    raise HTTPException(status_code=e.status_code, detail={"code": e.code, "message": e.message})


@router.get("", summary="Get or create cart", description="Returns the cart for the current user or guest. Creates one if none exists.")
async def get_cart(
    request: Request,
    response: Response,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session_token = _get_session_token(request, response)
    data = await cart_service.get_cart(db, user.id if user else None, session_token)
    return {"data": data, "meta": None}


@router.post("/items", summary="Add item to cart", status_code=201)
async def add_item(
    body: AddItemRequest,
    request: Request,
    response: Response,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session_token = _get_session_token(request, response)
    try:
        data = await cart_service.add_item(db, user.id if user else None, session_token, body.product_id, body.quantity)
    except AppError as e:
        _raise(e)
    return {"data": data, "meta": None}


@router.put("/items/{product_id}", summary="Update item quantity")
async def update_item(
    product_id: uuid.UUID,
    body: UpdateItemRequest,
    request: Request,
    response: Response,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session_token = _get_session_token(request, response)
    try:
        data = await cart_service.update_item(db, user.id if user else None, session_token, product_id, body.quantity)
    except AppError as e:
        _raise(e)
    return {"data": data, "meta": None}


@router.delete("/items/{product_id}", summary="Remove item from cart")
async def remove_item(
    product_id: uuid.UUID,
    request: Request,
    response: Response,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session_token = _get_session_token(request, response)
    try:
        data = await cart_service.remove_item(db, user.id if user else None, session_token, product_id)
    except AppError as e:
        _raise(e)
    return {"data": data, "meta": None}


@router.delete("", summary="Clear entire cart")
async def clear_cart(
    request: Request,
    response: Response,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session_token = _get_session_token(request, response)
    data = await cart_service.clear_cart(db, user.id if user else None, session_token)
    return {"data": data, "meta": None}


@router.post("/merge", summary="Merge guest cart into user cart after login")
async def merge_cart(
    body: MergeCartRequest,
    request: Request,
    response: Response,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail={"code": "AUTHENTICATION_REQUIRED", "message": "Login required to merge cart."})
    session_token = request.cookies.get(_GUEST_COOKIE)
    if not session_token:
        raise HTTPException(status_code=404, detail={"code": "NO_GUEST_CART", "message": "No guest cart to merge."})
    try:
        data = await cart_service.merge_carts(db, user.id, session_token, body.strategy)
    except AppError as e:
        _raise(e)
    response.delete_cookie(_GUEST_COOKIE)
    return {"data": data, "meta": None}
