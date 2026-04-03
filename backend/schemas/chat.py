from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class PartialNdaParty(BaseModel):
    company: str | None = None
    name: str | None = None
    title: str | None = None
    address: str | None = None


class PartialNdaFields(BaseModel):
    purpose: str | None = None
    effective_date: str | None = None  # YYYY-MM-DD
    mnda_term_type: Literal["expires", "continues"] | None = None
    mnda_term_years: int | None = None
    term_of_confidentiality_type: Literal["years", "perpetuity"] | None = None
    term_of_confidentiality_years: int | None = None
    governing_law: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None
    party1: PartialNdaParty | None = None
    party2: PartialNdaParty | None = None


class AiChatOutput(BaseModel):
    """Structured output returned by the LLM."""

    reply: str
    fields: PartialNdaFields


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: PartialNdaFields


class ChatResponse(BaseModel):
    reply: str
    fields: PartialNdaFields
