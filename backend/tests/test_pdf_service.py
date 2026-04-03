"""Unit tests for PDF service: HTML rendering and PDF generation."""

import pytest

from services.pdf_service import generate_pdf, render_nda_html


@pytest.fixture
def nda_data():
    return {
        "purpose": "Evaluating a potential business relationship.",
        "effective_date": "2026-01-01",
        "mnda_term": {"type": "expires", "years": 1},
        "term_of_confidentiality": {"type": "years", "years": 2},
        "governing_law": "Delaware",
        "jurisdiction": "New Castle, DE",
        "modifications": "",
        "party1": {
            "company": "Acme Corp",
            "name": "Alice Smith",
            "title": "CEO",
            "address": "alice@acme.com",
        },
        "party2": {
            "company": "Beta LLC",
            "name": "Bob Jones",
            "title": "CTO",
            "address": "bob@beta.com",
        },
    }


class TestRenderNdaHtml:
    def test_renders_html_string(self, nda_data):
        html = render_nda_html(nda_data)
        assert isinstance(html, str)
        assert "<html" in html

    def test_purpose_appears_in_output(self, nda_data):
        html = render_nda_html(nda_data)
        assert "Evaluating a potential business relationship." in html

    def test_parties_appear_in_output(self, nda_data):
        html = render_nda_html(nda_data)
        assert "Acme Corp" in html
        assert "Beta LLC" in html

    def test_governing_law_appears_in_output(self, nda_data):
        html = render_nda_html(nda_data)
        assert "Delaware" in html

    def test_jurisdiction_appears_in_output(self, nda_data):
        html = render_nda_html(nda_data)
        assert "New Castle, DE" in html

    def test_effective_date_formatted(self, nda_data):
        html = render_nda_html(nda_data)
        assert "January 1, 2026" in html

    def test_expires_checkbox_checked(self, nda_data):
        html = render_nda_html(nda_data)
        assert "☑" in html

    def test_continues_until_terminated(self, nda_data):
        data = {**nda_data, "mnda_term": {"type": "continues", "years": None}}
        html = render_nda_html(data)
        assert "Continues until terminated" in html

    def test_perpetuity_confidentiality(self, nda_data):
        data = {
            **nda_data,
            "term_of_confidentiality": {"type": "perpetuity", "years": None},
        }
        html = render_nda_html(data)
        assert "In perpetuity" in html

    def test_modifications_none_when_empty(self, nda_data):
        html = render_nda_html(nda_data)
        assert "None" in html

    def test_modifications_shown_when_present(self, nda_data):
        data = {**nda_data, "modifications": "Section 9 is modified to use CA law."}
        html = render_nda_html(data)
        assert "Section 9 is modified to use CA law." in html


class TestGeneratePdf:
    def test_returns_bytes(self, nda_data):
        pdf_bytes = generate_pdf(nda_data)
        assert isinstance(pdf_bytes, bytes)

    def test_is_valid_pdf(self, nda_data):
        pdf_bytes = generate_pdf(nda_data)
        assert pdf_bytes[:4] == b"%PDF"

    def test_non_empty(self, nda_data):
        pdf_bytes = generate_pdf(nda_data)
        assert len(pdf_bytes) > 1000
