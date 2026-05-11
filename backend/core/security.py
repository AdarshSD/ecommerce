import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from core.config import settings

ALGORITHM = "HS256"
_BCRYPT_ROUNDS = 12

# Pre-computed dummy hash used to prevent timing attacks on login.
# We always run bcrypt.checkpw even when the user doesn't exist.
_DUMMY_HASH: bytes = bcrypt.hashpw(b"__dummy__", bcrypt.gensalt(_BCRYPT_ROUNDS))


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(_BCRYPT_ROUNDS)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def verify_password_timing_safe(plain: str, hashed: str | None) -> bool:
    """Always runs bcrypt even when hashed is None to prevent timing attacks."""
    check_against = hashed.encode() if hashed is not None else _DUMMY_HASH
    try:
        return bcrypt.checkpw(plain.encode(), check_against)
    except Exception:
        return False


def create_access_token(sub: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": sub, "role": role, "exp": expire},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


def generate_refresh_token() -> str:
    return secrets.token_hex(32)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
