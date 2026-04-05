import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from models.user import User
from schemas.share import (
    CreateSigningSessionRequest,
    SigningPageDocument,
    SigningRequestStatus,
    SigningSessionStatusResponse,
    SubmitSignatureRequest,
)
from services import signing_service
from services.signing_service import _get_all_requests

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/documents/{doc_id}/signing-sessions", response_model=SigningSessionStatusResponse)
def create_signing_session(
    doc_id: int,
    body: CreateSigningSessionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SigningSessionStatusResponse:
    if not body.signatories:
        raise HTTPException(status_code=422, detail="At least one signatory is required")
    if len(body.signatories) > 10:
        raise HTTPException(status_code=422, detail="Maximum 10 signatories allowed")

    base_url = str(request.base_url).rstrip("/")
    try:
        session = signing_service.create_session(
            db, doc_id, current_user.id, body.signatories, base_url
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception:
        logger.exception("Failed to create signing session")
        raise HTTPException(status_code=500, detail="Failed to create signing session")

    requests = _get_all_requests(db, session.id)
    return SigningSessionStatusResponse(
        id=session.id,
        status=session.status,
        created_at=session.created_at,
        expires_at=session.expires_at,
        requests=[SigningRequestStatus.model_validate(r) for r in requests],
    )


@router.get("/signing-sessions/{session_id}", response_model=SigningSessionStatusResponse)
def get_signing_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SigningSessionStatusResponse:
    session = signing_service.get_session_status(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Signing session not found")

    requests = _get_all_requests(db, session.id)
    return SigningSessionStatusResponse(
        id=session.id,
        status=session.status,
        created_at=session.created_at,
        expires_at=session.expires_at,
        requests=[SigningRequestStatus.model_validate(r) for r in requests],
    )


@router.get("/sign/{token}", response_model=SigningPageDocument)
def get_sign_page(
    token: str,
    db: Session = Depends(get_db),
) -> SigningPageDocument:
    result = signing_service.get_sign_page(db, token)
    if not result:
        raise HTTPException(status_code=404, detail="Signing link not found or expired")

    req, session, doc = result
    if req.signed_at is not None:
        raise HTTPException(status_code=410, detail="This link has already been used")

    try:
        fields = json.loads(doc.fields_json)
    except Exception:
        logger.exception("Corrupt fields_json for document %d", doc.id)
        raise HTTPException(status_code=500, detail="Document data could not be read")

    return SigningPageDocument(
        document_type=doc.document_type,
        title=doc.title,
        fields=fields,
        signatory_name=req.name,
        signatory_role=req.role,
        session_status=session.status,
    )


@router.post("/sign/{token}")
def submit_signature(
    token: str,
    body: SubmitSignatureRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    ip_address = request.client.host if request.client else None
    base_url = str(request.base_url).rstrip("/")
    try:
        result = signing_service.submit_signature(
            db, token, body.signed_name, body.signed_title, ip_address, base_url
        )
    except ValueError as exc:
        raise HTTPException(status_code=410, detail=str(exc))
    except Exception:
        logger.exception("Failed to submit signature")
        raise HTTPException(status_code=500, detail="Failed to submit signature")
    return {"status": "signed", **result}
