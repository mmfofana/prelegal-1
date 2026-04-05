"""Tests for POST /api/explain-clause."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


def _signup(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "user@test.com", "password": "pass1234"})
    client.post("/api/auth/signin", json={"email": "user@test.com", "password": "pass1234"})


_MOCK_EXPLANATION = MagicMock(explanation="Plain English explanation.", risks=["Risk 1", "Risk 2"])

_VALID_BODY = {
    "clause_text": "The parties agree to keep all information confidential.",
    "document_type": "mutual-nda",
}


class TestExplainAuth:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        resp = client.post("/api/explain-clause", json=_VALID_BODY)
        assert resp.status_code == 401

    def test_authenticated_returns_200(self, client: TestClient) -> None:
        _signup(client)
        with patch("services.explain_service.explain_clause", return_value=_MOCK_EXPLANATION):
            resp = client.post("/api/explain-clause", json=_VALID_BODY)
        assert resp.status_code == 200


class TestExplainResponse:
    def test_returns_explanation_and_risks(self, client: TestClient) -> None:
        _signup(client)
        with patch("services.explain_service.explain_clause", return_value=_MOCK_EXPLANATION):
            resp = client.post("/api/explain-clause", json=_VALID_BODY)
        data = resp.json()
        assert "explanation" in data
        assert "risks" in data
        assert isinstance(data["risks"], list)

    def test_invalid_document_type_returns_422(self, client: TestClient) -> None:
        _signup(client)
        resp = client.post(
            "/api/explain-clause",
            json={"clause_text": "Some text", "document_type": "not-a-real-type"},
        )
        assert resp.status_code == 422

    def test_clause_text_too_long_returns_422(self, client: TestClient) -> None:
        _signup(client)
        resp = client.post(
            "/api/explain-clause",
            json={"clause_text": "x" * 5001, "document_type": "mutual-nda"},
        )
        assert resp.status_code == 422

    def test_ai_error_returns_500(self, client: TestClient) -> None:
        _signup(client)
        with patch("services.explain_service.explain_clause", side_effect=RuntimeError("AI down")):
            resp = client.post("/api/explain-clause", json=_VALID_BODY)
        assert resp.status_code == 500
