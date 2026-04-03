"""Generic document schemas for multi-document-type support."""
from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, field_validator


class Party(BaseModel):
    company: str
    name: str
    title: str
    address: str


class GeneratePdfRequest(BaseModel):
    document_type: str
    effective_date: str
    governing_law: str
    jurisdiction: str
    party1: Party
    party2: Party
    extra_fields: dict[str, str]

    @field_validator("effective_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("effective_date must be in YYYY-MM-DD format")
        return v

    @field_validator("document_type")
    @classmethod
    def validate_document_type(cls, v: str) -> str:
        from document_registry import DOCUMENT_REGISTRY

        if v not in DOCUMENT_REGISTRY:
            raise ValueError(f"Unsupported document type: {v}")
        return v


# ── Chat schemas ────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class PartialParty(BaseModel):
    company: str | None = None
    name: str | None = None
    title: str | None = None
    address: str | None = None


class PartialDocumentFields(BaseModel):
    """Partial field values extracted by the AI during conversation."""

    effective_date: str | None = None
    governing_law: str | None = None
    jurisdiction: str | None = None
    party1: PartialParty | None = None
    party2: PartialParty | None = None
    # Document-specific fields as flat key→value pairs (null means "unknown")
    extra_fields: dict[str, str | None] | None = None


class AiDocumentOutput(BaseModel):
    """Structured output returned by the LLM."""

    reply: str
    fields: PartialDocumentFields


class DocumentChatRequest(BaseModel):
    document_type: str
    messages: list[ChatMessage]
    current_fields: PartialDocumentFields


class DocumentChatResponse(BaseModel):
    reply: str
    fields: PartialDocumentFields
