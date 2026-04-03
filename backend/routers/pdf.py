from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from document_registry import DOCUMENT_REGISTRY
from schemas.document import GeneratePdfRequest
from services.pdf_service import generate_pdf

router = APIRouter()


@router.post("/generate-pdf")
def generate_document_pdf(request: GeneratePdfRequest) -> Response:
    """Generate a PDF from submitted cover page fields for any supported document type."""
    doc_def = DOCUMENT_REGISTRY[request.document_type]
    try:
        pdf_bytes = generate_pdf(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail="PDF generation failed") from exc

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{doc_def.pdf_filename}"'},
    )
