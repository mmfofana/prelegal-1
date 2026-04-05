import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from deps import get_optional_user
from document_registry import DOCUMENT_REGISTRY
from models.user import User
from schemas.document import GeneratePdfRequest
from services.docx_service import generate_docx

logger = logging.getLogger(__name__)

router = APIRouter()

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@router.post("/generate-docx")
def generate_document_docx(
    request: GeneratePdfRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> Response:
    """Generate a DOCX from submitted cover page fields for any supported document type."""
    doc_def = DOCUMENT_REGISTRY[request.document_type]
    try:
        docx_bytes = generate_docx(request.model_dump())
    except Exception as exc:
        logger.exception("DOCX generation failed")
        raise HTTPException(status_code=500, detail="DOCX generation failed") from exc

    filename = doc_def.pdf_filename.replace(".pdf", ".docx")
    return Response(
        content=docx_bytes,
        media_type=DOCX_MIME,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
