"""Tests for e-signature endpoints."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


def _signup_and_save_doc(client: TestClient) -> int:
    client.post("/api/auth/signup", json={"email": "user@test.com", "password": "pass1234"})
    client.post("/api/auth/signin", json={"email": "user@test.com", "password": "pass1234"})
    payload = {
        "document_type": "mutual-nda",
        "effective_date": "2026-01-01",
        "governing_law": "Delaware",
        "jurisdiction": "New Castle, DE",
        "party1": {"company": "Acme", "name": "Alice", "title": "CEO", "address": "a@acme.com"},
        "party2": {"company": "Beta", "name": "Bob", "title": "CTO", "address": "b@beta.com"},
        "extra_fields": {
            "purpose": "Test",
            "mnda_term_type": "expires",
            "mnda_term_years": "1",
            "term_of_confidentiality_type": "years",
            "term_of_confidentiality_years": "2",
            "modifications": "",
        },
    }
    with patch("services.pdf_service.generate_pdf", return_value=b"%PDF-fake"):
        client.post("/api/generate-pdf", json=payload)
    return client.get("/api/documents").json()[0]["id"]


_SIGNATORIES = [
    {"email": "alice@acme.com", "name": "Alice Smith", "role": "Party 1"},
    {"email": "bob@beta.com", "name": "Bob Jones", "role": "Party 2"},
]


class TestCreateSigningSession:
    def test_requires_auth(self, client: TestClient) -> None:
        resp = client.post("/api/documents/1/signing-sessions", json={"signatories": _SIGNATORIES})
        assert resp.status_code == 401

    def test_creates_session(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        with patch("services.email_service.send_signing_invite"):
            resp = client.post(
                f"/api/documents/{doc_id}/signing-sessions",
                json={"signatories": _SIGNATORIES},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "pending"
        assert len(data["requests"]) == 2

    def test_empty_signatories_returns_422(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        resp = client.post(
            f"/api/documents/{doc_id}/signing-sessions",
            json={"signatories": []},
        )
        assert resp.status_code == 422

    def test_404_for_wrong_owner(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        client.post("/api/auth/signup", json={"email": "other@test.com", "password": "pass1234"})
        client.post("/api/auth/signin", json={"email": "other@test.com", "password": "pass1234"})
        with patch("services.email_service.send_signing_invite"):
            resp = client.post(
                f"/api/documents/{doc_id}/signing-sessions",
                json={"signatories": _SIGNATORIES},
            )
        assert resp.status_code == 404


class TestSignFlow:
    def _create_session_and_get_token(self, client: TestClient) -> tuple[int, str]:
        doc_id = _signup_and_save_doc(client)
        with patch("services.email_service.send_signing_invite"):
            resp = client.post(
                f"/api/documents/{doc_id}/signing-sessions",
                json={"signatories": [{"email": "alice@acme.com", "name": "Alice", "role": "Party 1"}]},
            )
        session_id = resp.json()["id"]
        token = resp.json()["requests"][0]["token"] if "token" in resp.json()["requests"][0] else None

        # Get token from DB indirectly by calling get_session
        session_resp = client.get(f"/api/signing-sessions/{session_id}")
        req_id = session_resp.json()["requests"][0]["id"]

        from database import SessionLocal
        from models.signing_session import SigningRequest
        db = SessionLocal()
        req = db.query(SigningRequest).filter(SigningRequest.id == req_id).first()
        token = req.token
        db.close()
        return session_id, token

    def test_get_sign_page(self, client: TestClient) -> None:
        _, token = self._create_session_and_get_token(client)
        client.cookies.clear()
        resp = client.get(f"/api/sign/{token}")
        assert resp.status_code == 200
        data = resp.json()
        assert "document_type" in data
        assert data["signatory_name"] == "Alice"

    def test_submit_signature(self, client: TestClient) -> None:
        session_id, token = self._create_session_and_get_token(client)
        client.cookies.clear()
        with patch("services.email_service.send_completion_email"):
            with patch("services.pdf_service.generate_signed_pdf", return_value=b"%PDF-signed"):
                resp = client.post(
                    f"/api/sign/{token}",
                    json={"signed_name": "Alice Smith", "signed_title": "CEO"},
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "signed"
        assert data["all_signed"] is True

    def test_invalid_token_returns_404(self, client: TestClient) -> None:
        resp = client.get("/api/sign/badtoken")
        assert resp.status_code == 404

    def test_already_signed_returns_410(self, client: TestClient) -> None:
        session_id, token = self._create_session_and_get_token(client)
        client.cookies.clear()
        with patch("services.email_service.send_completion_email"):
            with patch("services.pdf_service.generate_signed_pdf", return_value=b"%PDF-signed"):
                client.post(
                    f"/api/sign/{token}",
                    json={"signed_name": "Alice Smith", "signed_title": "CEO"},
                )
                # Try to sign again
                resp = client.post(
                    f"/api/sign/{token}",
                    json={"signed_name": "Alice Smith", "signed_title": "CEO"},
                )
        assert resp.status_code == 410
