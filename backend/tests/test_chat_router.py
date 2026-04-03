from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from schemas.document import AiDocumentOutput, PartialDocumentFields

_CHAT_URL = "/api/chat"
_SIGNUP_URL = "/api/auth/signup"
_EMAIL = "alice@example.com"
_PASSWORD = "securepassword123"

_VALID_PAYLOAD = {
    "document_type": "mutual-nda",
    "messages": [{"role": "user", "content": "I need an NDA between Acme and Beta"}],
    "current_fields": {},
}

_MOCK_OUTPUT = AiDocumentOutput(
    reply="Got it! What is the purpose of sharing confidential information?",
    fields=PartialDocumentFields(
        party1=None,
        party2=None,
    ),
)


def _signup(client: TestClient) -> None:
    client.post(_SIGNUP_URL, json={"email": _EMAIL, "password": _PASSWORD})


class TestChatAuth:
    def test_chat_requires_session_cookie(self, client: TestClient):
        r = client.post(_CHAT_URL, json=_VALID_PAYLOAD)
        assert r.status_code == 401

    def test_chat_rejects_invalid_cookie(self, client: TestClient):
        client.cookies.set("session", "bad-token")
        r = client.post(_CHAT_URL, json=_VALID_PAYLOAD)
        assert r.status_code == 401

    def test_chat_allows_authenticated_user(self, client: TestClient):
        _signup(client)
        with patch("services.chat_service.get_ai_response", return_value=_MOCK_OUTPUT):
            r = client.post(_CHAT_URL, json=_VALID_PAYLOAD)
        assert r.status_code == 200


class TestChatResponse:
    def test_chat_returns_reply(self, client: TestClient):
        _signup(client)
        with patch("services.chat_service.get_ai_response", return_value=_MOCK_OUTPUT):
            r = client.post(_CHAT_URL, json=_VALID_PAYLOAD)
        assert r.json()["reply"] == _MOCK_OUTPUT.reply

    def test_chat_returns_fields(self, client: TestClient):
        _signup(client)
        mock_output = AiDocumentOutput(
            reply="Thanks!",
            fields=PartialDocumentFields(
                governing_law="Delaware",
                extra_fields={"purpose": "evaluating a partnership"},
            ),
        )
        with patch("services.chat_service.get_ai_response", return_value=mock_output):
            r = client.post(_CHAT_URL, json=_VALID_PAYLOAD)
        data = r.json()
        assert data["fields"]["governing_law"] == "Delaware"
        assert data["fields"]["extra_fields"]["purpose"] == "evaluating a partnership"
        assert data["fields"]["jurisdiction"] is None

    def test_chat_passes_document_type_to_service(self, client: TestClient):
        _signup(client)
        payload = {
            "document_type": "cloud-service-agreement",
            "messages": [{"role": "user", "content": "I need a SaaS agreement"}],
            "current_fields": {"governing_law": "California"},
        }
        with patch("services.chat_service.get_ai_response", return_value=_MOCK_OUTPUT) as mock_fn:
            client.post(_CHAT_URL, json=payload)
        call_args = mock_fn.call_args
        doc_type_arg, messages_arg, current_fields_arg = call_args[0]
        assert doc_type_arg == "cloud-service-agreement"
        assert len(messages_arg) == 1

    def test_chat_passes_messages_to_service(self, client: TestClient):
        _signup(client)
        payload = {
            "document_type": "mutual-nda",
            "messages": [
                {"role": "user", "content": "NDA for Acme and Beta"},
                {"role": "assistant", "content": "What is the purpose?"},
                {"role": "user", "content": "Evaluating a partnership"},
            ],
            "current_fields": {},
        }
        with patch("services.chat_service.get_ai_response", return_value=_MOCK_OUTPUT) as mock_fn:
            client.post(_CHAT_URL, json=payload)
        call_args = mock_fn.call_args
        _, messages_arg, _ = call_args[0]
        assert len(messages_arg) == 3
        assert messages_arg[0].content == "NDA for Acme and Beta"

    def test_chat_returns_500_on_ai_error(self, client: TestClient):
        _signup(client)
        with patch("services.chat_service.get_ai_response", side_effect=Exception("API down")):
            r = client.post(_CHAT_URL, json=_VALID_PAYLOAD)
        assert r.status_code == 500

    def test_chat_validates_message_role(self, client: TestClient):
        _signup(client)
        payload = {
            "document_type": "mutual-nda",
            "messages": [{"role": "invalid_role", "content": "hello"}],
            "current_fields": {},
        }
        with patch("services.chat_service.get_ai_response", return_value=_MOCK_OUTPUT):
            r = client.post(_CHAT_URL, json=payload)
        assert r.status_code == 422
