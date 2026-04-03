"""Service layer for saved document operations."""
from __future__ import annotations

import json

from sqlalchemy.orm import Session

from document_registry import DOCUMENT_REGISTRY
from models.saved_document import SavedDocument


def generate_title(document_type: str, fields: dict) -> str:
    """Auto-generate a human-readable title from party names and document type."""
    party1_company = (fields.get("party1") or {}).get("company", "").strip()
    party2_company = (fields.get("party2") or {}).get("company", "").strip()
    doc_def = DOCUMENT_REGISTRY.get(document_type)
    display_name = doc_def.display_name if doc_def else document_type
    if party1_company and party2_company:
        return f"{party1_company} / {party2_company} — {display_name}"
    if party1_company:
        return f"{party1_company} — {display_name}"
    return f"{display_name} — Draft"


def save_document(db: Session, user_id: int, document_type: str, fields: dict) -> SavedDocument:
    title = generate_title(document_type, fields)
    doc = SavedDocument(
        user_id=user_id,
        document_type=document_type,
        title=title,
        fields_json=json.dumps(fields),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def list_documents(db: Session, user_id: int) -> list[SavedDocument]:
    return (
        db.query(SavedDocument)
        .filter(SavedDocument.user_id == user_id)
        .order_by(SavedDocument.created_at.desc())
        .all()
    )


def get_document(db: Session, user_id: int, doc_id: int) -> SavedDocument | None:
    return (
        db.query(SavedDocument)
        .filter(SavedDocument.id == doc_id, SavedDocument.user_id == user_id)
        .first()
    )


def delete_document(db: Session, user_id: int, doc_id: int) -> bool:
    doc = get_document(db, user_id, doc_id)
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True
