"""Schemas for share links and e-signature endpoints."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


# ── Feature 6: Share ─────────────────────────────────────────────────────────

class ShareResponse(BaseModel):
    token: str
    url: str


class SharedDocumentResponse(BaseModel):
    document_type: str
    title: str
    fields: dict


# ── Feature 7: Signing ───────────────────────────────────────────────────────

class SignatoryInput(BaseModel):
    email: EmailStr
    name: str
    role: str


class CreateSigningSessionRequest(BaseModel):
    signatories: list[SignatoryInput]


class SigningRequestStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    role: str
    signed_at: datetime | None


class SigningSessionStatusResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    expires_at: datetime
    requests: list[SigningRequestStatus]


class SigningPageDocument(BaseModel):
    document_type: str
    title: str
    fields: dict
    signatory_name: str
    signatory_role: str
    session_status: str


class SubmitSignatureRequest(BaseModel):
    signed_name: str
    signed_title: str
