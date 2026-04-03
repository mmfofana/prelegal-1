import os

import bcrypt
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer  # noqa: F401 — re-exported for callers

SESSION_COOKIE_MAX_AGE = 86400 * 30  # 30 days


def _build_serializer() -> URLSafeTimedSerializer:
    secret = os.environ.get("SESSION_SECRET")
    if not secret:
        raise RuntimeError("SESSION_SECRET environment variable is required")
    return URLSafeTimedSerializer(secret)


# Built once at import time; fails fast if SESSION_SECRET is missing.
_serializer = _build_serializer()

_SALT = "session"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_session_token(user_id: int) -> str:
    return _serializer.dumps(user_id, salt=_SALT)


def decode_session_token(token: str) -> int:
    """Returns user_id. Raises BadSignature or SignatureExpired on failure."""
    return _serializer.loads(token, salt=_SALT, max_age=SESSION_COOKIE_MAX_AGE)
