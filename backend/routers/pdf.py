import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from deps import get_optional_user
from document_registry import DOCUMENT_REGISTRY
from models.user import User
from schemas.document import GeneratePdfRequest
from services import document_service
from services.pdf_service import generate_pdf

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate-pdf")
def generate_document_pdf(
    request: GeneratePdfRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> Response:
    """Generate a PDF from submitted cover page fields for any supported document type."""
    doc_def = DOCUMENT_REGISTRY[request.document_type]
    try:
        pdf_bytes = generate_pdf(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail="PDF generation failed") from exc

    if current_user is not None:
        try:
            fields = {k: v for k, v in request.model_dump().items() if k != "document_type"}
            document_service.save_document(db, current_user.id, request.document_type, fields)
        except Exception:
            logger.exception("Failed to save document for user %d", current_user.id)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{doc_def.pdf_filename}"'},
    )
