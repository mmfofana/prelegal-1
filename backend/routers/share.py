import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from models.user import User
from schemas.share import ShareResponse, SharedDocumentResponse
from services import document_service, share_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/documents/{doc_id}/share", response_model=ShareResponse)
def create_share(
    doc_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareResponse:
    doc = document_service.get_document(db, current_user.id, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    base_url = str(request.base_url).rstrip("/")
    share = share_service.create_share(db, doc_id, current_user.id, base_url)
    url = share_service.get_share_url(base_url, share.token)
    return ShareResponse(token=share.token, url=url)


@router.get("/share/{token}", response_model=SharedDocumentResponse)
def get_shared_document(
    token: str,
    db: Session = Depends(get_db),
) -> SharedDocumentResponse:
    result = share_service.get_shared_document(db, token)
    if not result:
        raise HTTPException(status_code=404, detail="Share link not found or expired")

    doc, _share = result
    try:
        fields = json.loads(doc.fields_json)
    except Exception:
        logger.exception("Corrupt fields_json for document %d", doc.id)
        raise HTTPException(status_code=500, detail="Document data could not be read")

    return SharedDocumentResponse(
        document_type=doc.document_type,
        title=doc.title,
        fields=fields,
    )
