"""Tests for POST /api/review-document."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


def _signup(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "user@test.com", "password": "pass1234"})
    client.post("/api/auth/signin", json={"email": "user@test.com", "password": "pass1234"})


_MOCK_REVIEW = MagicMock(
    completeness_score=75,
    risks=[MagicMock(severity="medium", field="governing_law", message="State not specified")],
    suggestions=["Add a governing law", "Specify jurisdiction"],
)

_VALID_BODY = {
    "document_type": "mutual-nda",
    "fields": {
        "effective_date": "2026-01-01",
        "governing_law": "Delaware",
        "jurisdiction": "New Castle, DE",
    },
}


class TestReviewAuth:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        resp = client.post("/api/review-document", json=_VALID_BODY)
        assert resp.status_code == 401

    def test_authenticated_returns_200(self, client: TestClient) -> None:
        _signup(client)
        with patch("services.review_service.review_document", return_value=_MOCK_REVIEW):
            resp = client.post("/api/review-document", json=_VALID_BODY)
        assert resp.status_code == 200


class TestReviewResponse:
    def test_returns_all_fields(self, client: TestClient) -> None:
        _signup(client)
        with patch("services.review_service.review_document", return_value=_MOCK_REVIEW):
            resp = client.post("/api/review-document", json=_VALID_BODY)
        data = resp.json()
        assert "completeness_score" in data
        assert "risks" in data
        assert "suggestions" in data

    def test_invalid_document_type_returns_422(self, client: TestClient) -> None:
        _signup(client)
        resp = client.post(
            "/api/review-document",
            json={"document_type": "bad-type", "fields": {}},
        )
        assert resp.status_code == 422

    def test_ai_error_returns_500(self, client: TestClient) -> None:
        _signup(client)
        with patch("services.review_service.review_document", side_effect=RuntimeError("AI down")):
            resp = client.post("/api/review-document", json=_VALID_BODY)
        assert resp.status_code == 500
