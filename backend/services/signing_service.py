"""Service layer for e-signature sessions."""
from __future__ import annotations

import json
import logging
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from models.saved_document import SavedDocument
from models.signing_session import SigningRequest, SigningSession
from schemas.share import SignatoryInput
from services import email_service

logger = logging.getLogger(__name__)


def _get_all_requests(db: Session, session_id: int) -> list[SigningRequest]:
    return (
        db.query(SigningRequest)
        .filter(SigningRequest.session_id == session_id)
        .all()
    )


def create_session(
    db: Session,
    document_id: int,
    user_id: int,
    signatories: list[SignatoryInput],
    base_url: str,
    expires_days: int = 7,
) -> SigningSession:
    doc = (
        db.query(SavedDocument)
        .filter(SavedDocument.id == document_id, SavedDocument.user_id == user_id)
        .first()
    )
    if not doc:
        raise ValueError("Document not found or not owned by user")

    expires_at = datetime.now(UTC) + timedelta(days=expires_days)
    session = SigningSession(
        document_id=document_id,
        created_by=user_id,
        status="pending",
        expires_at=expires_at,
    )
    db.add(session)
    db.flush()

    requests = []
    for signatory in signatories:
        req = SigningRequest(
            session_id=session.id,
            email=signatory.email,
            name=signatory.name,
            role=signatory.role,
            token=secrets.token_urlsafe(32),
        )
        db.add(req)
        requests.append(req)

    db.commit()
    db.refresh(session)

    sign_base = base_url.rstrip("/")
    for req in requests:
        db.refresh(req)
        sign_url = f"{sign_base}/sign/{req.token}"
        try:
            email_service.send_signing_invite(req.email, req.name, doc.title, sign_url)
        except Exception:
            logger.exception("Failed to send signing invite to %s", req.email)

    return session


def get_session_status(
    db: Session,
    session_id: int,
    user_id: int,
) -> SigningSession | None:
    session = (
        db.query(SigningSession)
        .filter(SigningSession.id == session_id, SigningSession.created_by == user_id)
        .first()
    )
    if not session:
        return None

    now = datetime.now(UTC).replace(tzinfo=None)  # SQLite stores naive datetimes
    expires_at = session.expires_at.replace(tzinfo=None) if session.expires_at else None
    if session.status == "pending" and expires_at is not None and expires_at < now:
        session.status = "expired"
        db.commit()

    return session


def get_sign_page(
    db: Session,
    token: str,
) -> tuple[SigningRequest, SigningSession, SavedDocument] | None:
    req = (
        db.query(SigningRequest)
        .filter(SigningRequest.token == token)
        .first()
    )
    if not req:
        return None

    session = db.query(SigningSession).filter(SigningSession.id == req.session_id).first()
    if not session:
        return None

    now = datetime.now(UTC).replace(tzinfo=None)  # SQLite stores naive datetimes
    expires_at = session.expires_at.replace(tzinfo=None) if session.expires_at else None
    if expires_at is not None and expires_at < now:
        if session.status == "pending":
            session.status = "expired"
            db.commit()
        return None

    doc = db.query(SavedDocument).filter(SavedDocument.id == session.document_id).first()
    if not doc:
        return None

    return req, session, doc


def submit_signature(
    db: Session,
    token: str,
    signed_name: str,
    signed_title: str,
    ip_address: str | None,
    base_url: str,
) -> dict:
    result = get_sign_page(db, token)
    if not result:
        raise ValueError("Invalid, expired, or already-signed token")

    req, session, doc = result

    if req.signed_at is not None:
        raise ValueError("This document has already been signed with this link")

    req.signed_at = datetime.now(UTC)
    req.signed_name = signed_name
    req.signed_title = signed_title
    req.ip_address = ip_address
    db.flush()

    all_requests = _get_all_requests(db, session.id)
    all_signed = all(r.signed_at is not None for r in all_requests)

    if all_signed:
        session.status = "complete"

    db.commit()

    if all_signed:
        _handle_completion(db, session, doc, all_requests)

    return {"all_signed": all_signed}


def _handle_completion(
    db: Session,
    session: SigningSession,
    doc: SavedDocument,
    requests: list[SigningRequest],
) -> None:
    try:
        from services.pdf_service import generate_signed_pdf

        fields = json.loads(doc.fields_json)
        fields["document_type"] = doc.document_type
        pdf_bytes = generate_signed_pdf(fields, session, requests)

        all_emails = list({r.email for r in requests})
        email_service.send_completion_email(all_emails, doc.title, pdf_bytes)
    except Exception:
        logger.exception("Failed to handle completion for session %d", session.id)
