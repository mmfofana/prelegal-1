import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from models.user import User
from schemas.document import SavedDocumentDetail, SavedDocumentSummary
from services import document_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/documents", response_model=list[SavedDocumentSummary])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SavedDocumentSummary]:
    return document_service.list_documents(db, current_user.id)


@router.get("/documents/{doc_id}", response_model=SavedDocumentDetail)
def get_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedDocumentDetail:
    doc = document_service.get_document(db, current_user.id, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        fields = json.loads(doc.fields_json)
    except Exception:
        logger.exception("Corrupt fields_json for document %d", doc_id)
        raise HTTPException(status_code=500, detail="Document data could not be read")
    return SavedDocumentDetail(
        id=doc.id,
        document_type=doc.document_type,
        title=doc.title,
        fields=fields,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.delete("/documents/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not document_service.delete_document(db, current_user.id, doc_id):
        raise HTTPException(status_code=404, detail="Document not found")
