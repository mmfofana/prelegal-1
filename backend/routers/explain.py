import logging

from fastapi import APIRouter, Depends, HTTPException

from deps import get_current_user
from models.user import User
from schemas.explain import AiClauseExplanation, ExplainClauseRequest
from services import explain_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/explain-clause", response_model=AiClauseExplanation)
def explain_clause(
    body: ExplainClauseRequest,
    _user: User = Depends(get_current_user),
) -> AiClauseExplanation:
    try:
        return explain_service.explain_clause(body.clause_text, body.document_type)
    except Exception:
        logger.exception("AI service error in explain_clause")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")
