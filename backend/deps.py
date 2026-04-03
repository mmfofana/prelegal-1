"""Shared FastAPI dependencies."""

from fastapi import Cookie, Depends, HTTPException
from itsdangerous import BadSignature, SignatureExpired
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services.auth_service import decode_session_token


def get_current_user(
    session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user_id = decode_session_token(session)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def get_optional_user(
    session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """Like get_current_user but returns None instead of raising 401."""
    try:
        return get_current_user(session=session, db=db)
    except HTTPException:
        return None
