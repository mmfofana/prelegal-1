"""Schemas for the document review endpoint."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, field_validator

from schemas.document import PartialDocumentFields


class ReviewRisk(BaseModel):
    severity: Literal["high", "medium", "low"]
    field: str
    message: str


class AiDocumentReview(BaseModel):
    completeness_score: int
    risks: list[ReviewRisk]
    suggestions: list[str]


class DocumentReviewRequest(BaseModel):
    document_type: str
    fields: PartialDocumentFields

    @field_validator("document_type")
    @classmethod
    def validate_document_type(cls, v: str) -> str:
        from document_registry import DOCUMENT_REGISTRY

        if v not in DOCUMENT_REGISTRY:
            raise ValueError(f"Unsupported document type: {v}")
        return v
