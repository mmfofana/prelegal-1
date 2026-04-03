import logging

from fastapi import APIRouter, Depends, HTTPException

from deps import get_current_user
from models.user import User
from schemas.document import DocumentChatRequest, DocumentChatResponse
from services import chat_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=DocumentChatResponse)
def chat(
    body: DocumentChatRequest,
    _user: User = Depends(get_current_user),
) -> DocumentChatResponse:
    try:
        result = chat_service.get_ai_response(
            body.document_type, body.messages, body.current_fields
        )
    except Exception:
        logger.exception("AI service error")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")
    return DocumentChatResponse(reply=result.reply, fields=result.fields)
