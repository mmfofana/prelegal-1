from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from schemas.nda import NdaRequest
from services.pdf_service import generate_pdf

router = APIRouter()


@router.post("/generate-pdf")
def generate_nda_pdf(request: NdaRequest) -> Response:
    """Generate a Mutual NDA PDF from the submitted form data."""
    try:
        pdf_bytes = generate_pdf(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail="PDF generation failed") from exc

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="mutual-nda.pdf"'},
    )
