"""Schemas for the clause explain endpoint."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class ExplainClauseRequest(BaseModel):
    clause_text: str = Field(max_length=5000)
    document_type: str

    @field_validator("document_type")
    @classmethod
    def validate_document_type(cls, v: str) -> str:
        from document_registry import DOCUMENT_REGISTRY

        if v not in DOCUMENT_REGISTRY:
            raise ValueError(f"Unsupported document type: {v}")
        return v


class AiClauseExplanation(BaseModel):
    explanation: str
    risks: list[str]
