"""Service layer for document share links."""
from __future__ import annotations

import json
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from models.document_share import DocumentShare
from models.saved_document import SavedDocument


def create_share(
    db: Session,
    document_id: int,
    user_id: int,
    base_url: str,
    expires_days: int = 30,
) -> DocumentShare:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(days=expires_days)
    share = DocumentShare(
        document_id=document_id,
        created_by=user_id,
        token=token,
        expires_at=expires_at,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return share


def get_shared_document(
    db: Session,
    token: str,
) -> tuple[SavedDocument, DocumentShare] | None:
    share = (
        db.query(DocumentShare)
        .filter(DocumentShare.token == token)
        .first()
    )
    if not share:
        return None

    now = datetime.now(UTC).replace(tzinfo=None)  # SQLite stores naive datetimes
    expires_at = share.expires_at.replace(tzinfo=None) if share.expires_at else None
    if expires_at is not None and expires_at < now:
        return None

    doc = db.query(SavedDocument).filter(SavedDocument.id == share.document_id).first()
    if not doc:
        return None

    return doc, share


def get_share_url(request_base_url: str, token: str) -> str:
    base = request_base_url.rstrip("/")
    return f"{base}/share/{token}"
