import logging

from fastapi import APIRouter, Depends, HTTPException

from deps import get_current_user
from models.user import User
from schemas.review import AiDocumentReview, DocumentReviewRequest
from services import review_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/review-document", response_model=AiDocumentReview)
def review_document(
    body: DocumentReviewRequest,
    _user: User = Depends(get_current_user),
) -> AiDocumentReview:
    try:
        return review_service.review_document(body.document_type, body.fields)
    except Exception:
        logger.exception("AI service error in review_document")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")
