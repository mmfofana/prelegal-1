import os
from http import HTTPStatus

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from itsdangerous import BadSignature, SignatureExpired
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.auth import SigninRequest, SignupRequest, UserResponse
from services.auth_service import (
    SESSION_COOKIE_MAX_AGE,
    create_session_token,
    decode_session_token,
    hash_password,
    verify_password,
)

router = APIRouter()

_COOKIE_NAME = "session"
_INVALID_CREDENTIALS = "Invalid email or password"

# Shared cookie attributes — must match exactly on set and delete so browsers honor deletion.
_SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "false").lower() == "true"
_COOKIE_PARAMS: dict = {
    "httponly": True,
    "samesite": "lax",
    "secure": _SECURE_COOKIES,
}


def _set_session_cookie(response: Response, user_id: int) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=create_session_token(user_id),
        max_age=SESSION_COOKIE_MAX_AGE,
        **_COOKIE_PARAMS,
    )


@router.post("/signup", response_model=UserResponse, status_code=HTTPStatus.CREATED)
def signup(body: SignupRequest, response: Response, db: Session = Depends(get_db)) -> User:
    user = User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    _set_session_cookie(response, user.id)
    return user


@router.post("/signin", response_model=UserResponse)
def signin(body: SigninRequest, response: Response, db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail=_INVALID_CREDENTIALS)
    _set_session_cookie(response, user.id)
    return user


@router.post("/signout")
def signout(response: Response) -> dict:
    response.delete_cookie(key=_COOKIE_NAME, **_COOKIE_PARAMS)
    return {"message": "Signed out"}


@router.get("/me", response_model=UserResponse)
def me(
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
