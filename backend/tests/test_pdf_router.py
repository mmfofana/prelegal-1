"""Integration tests for POST /api/generate-pdf."""

import pytest


class TestGeneratePdfEndpoint:
    def test_returns_pdf_on_valid_nda_input(self, client, valid_nda_payload):
        res = client.post("/api/generate-pdf", json=valid_nda_payload)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert res.content[:4] == b"%PDF"

    def test_nda_content_disposition_header(self, client, valid_nda_payload):
        res = client.post("/api/generate-pdf", json=valid_nda_payload)
        assert "mutual-nda.pdf" in res.headers["content-disposition"]

    def test_returns_pdf_on_valid_cloud_service_input(self, client, valid_cloud_service_payload):
        res = client.post("/api/generate-pdf", json=valid_cloud_service_payload)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert res.content[:4] == b"%PDF"

    def test_cloud_service_content_disposition_header(self, client, valid_cloud_service_payload):
        res = client.post("/api/generate-pdf", json=valid_cloud_service_payload)
        assert "cloud-service-agreement.pdf" in res.headers["content-disposition"]

    def test_invalid_document_type_returns_422(self, client, valid_nda_payload):
        payload = {**valid_nda_payload, "document_type": "nonexistent-document"}
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 422

    def test_missing_document_type_returns_422(self, client, valid_nda_payload):
        payload = {k: v for k, v in valid_nda_payload.items() if k != "document_type"}
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 422

    def test_missing_party1_returns_422(self, client, valid_nda_payload):
        payload = {k: v for k, v in valid_nda_payload.items() if k != "party1"}
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 422

    def test_missing_effective_date_returns_422(self, client, valid_nda_payload):
        payload = {k: v for k, v in valid_nda_payload.items() if k != "effective_date"}
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 422

    def test_health_endpoint(self, client):
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}
