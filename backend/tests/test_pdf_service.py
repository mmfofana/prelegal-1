"""Unit tests for PDF service: HTML rendering and PDF generation."""

import pytest

from services.pdf_service import generate_pdf, render_document_html, render_nda_html


@pytest.fixture
def nda_data():
    return {
        "document_type": "mutual-nda",
        "effective_date": "2026-01-01",
        "governing_law": "Delaware",
        "jurisdiction": "New Castle, DE",
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
        "extra_fields": {
            "purpose": "Evaluating a potential business relationship.",
            "mnda_term_type": "expires",
            "mnda_term_years": "1",
            "term_of_confidentiality_type": "years",
            "term_of_confidentiality_years": "2",
            "modifications": "",
        },
    }


@pytest.fixture
def cloud_service_data():
    return {
        "document_type": "cloud-service-agreement",
        "effective_date": "2026-01-01",
        "governing_law": "California",
        "jurisdiction": "Santa Clara County, CA",
        "party1": {
            "company": "CloudCo Inc.",
            "name": "Carol Chen",
            "title": "CEO",
            "address": "carol@cloudco.com",
        },
        "party2": {
            "company": "Customer Corp",
            "name": "Dave Davis",
            "title": "CTO",
            "address": "dave@customer.com",
        },
        "extra_fields": {
            "cloud_service_name": "CloudCo Platform",
            "subscription_period": "1 year",
            "fees": "$1,000/month",
            "payment_process": "invoicing",
            "general_cap_amount": "fees paid in prior 12 months",
            "increased_cap_amount": "2x fees paid in prior 12 months",
            "additional_warranties": "",
        },
    }


class TestRenderDocumentHtml:
    def test_renders_html_string(self, nda_data):
        html = render_document_html(nda_data)
        assert isinstance(html, str)
        assert "<html" in html

    def test_nda_purpose_appears_in_output(self, nda_data):
        html = render_document_html(nda_data)
        assert "Evaluating a potential business relationship." in html

    def test_nda_parties_appear_in_output(self, nda_data):
        html = render_document_html(nda_data)
        assert "Acme Corp" in html
        assert "Beta LLC" in html

    def test_nda_governing_law_appears_in_output(self, nda_data):
        html = render_document_html(nda_data)
        assert "Delaware" in html

    def test_nda_effective_date_formatted(self, nda_data):
        html = render_document_html(nda_data)
        assert "January 1, 2026" in html

    def test_nda_expires_checkbox(self, nda_data):
        html = render_document_html(nda_data)
        assert "☑" in html

    def test_nda_continues_until_terminated(self, nda_data):
        data = {**nda_data, "extra_fields": {**nda_data["extra_fields"], "mnda_term_type": "continues"}}
        html = render_document_html(data)
        assert "Continues until terminated" in html

    def test_nda_perpetuity_confidentiality(self, nda_data):
        data = {
            **nda_data,
            "extra_fields": {**nda_data["extra_fields"], "term_of_confidentiality_type": "perpetuity"},
        }
        html = render_document_html(data)
        assert "In perpetuity" in html

    def test_nda_modifications_none_when_empty(self, nda_data):
        html = render_document_html(nda_data)
        assert "None" in html

    def test_nda_modifications_shown_when_present(self, nda_data):
        data = {**nda_data, "extra_fields": {**nda_data["extra_fields"], "modifications": "Section 9 uses CA law."}}
        html = render_document_html(data)
        assert "Section 9 uses CA law." in html

    def test_cloud_service_renders_html(self, cloud_service_data):
        html = render_document_html(cloud_service_data)
        assert isinstance(html, str)
        assert "<html" in html

    def test_cloud_service_parties_appear(self, cloud_service_data):
        html = render_document_html(cloud_service_data)
        assert "CloudCo Inc." in html
        assert "Customer Corp" in html

    def test_cloud_service_fee_appears(self, cloud_service_data):
        html = render_document_html(cloud_service_data)
        assert "$1,000/month" in html

    def test_cloud_service_standard_terms_included(self, cloud_service_data):
        html = render_document_html(cloud_service_data)
        assert "Standard Terms" in html

    def test_invalid_document_type_raises(self, nda_data):
        data = {**nda_data, "document_type": "nonexistent"}
        with pytest.raises(ValueError, match="Unknown document type"):
            render_document_html(data)


class TestRenderNdaHtmlBackwardCompat:
    """Ensure the render_nda_html backward-compatible wrapper still works."""

    def test_accepts_old_format(self):
        old_style = {
            "purpose": "Testing.",
            "effective_date": "2026-01-01",
            "mnda_term": {"type": "expires", "years": 1},
            "term_of_confidentiality": {"type": "years", "years": 1},
            "governing_law": "Delaware",
            "jurisdiction": "New Castle, DE",
            "modifications": "",
            "party1": {"company": "Acme", "name": "Alice", "title": "CEO", "address": "a@a.com"},
            "party2": {"company": "Beta", "name": "Bob", "title": "CTO", "address": "b@b.com"},
        }
        html = render_nda_html(old_style)
        assert "Testing." in html
        assert "Acme" in html

    def test_accepts_new_format(self, nda_data):
        html = render_nda_html(nda_data)
        assert "<html" in html


class TestGeneratePdf:
    def test_nda_returns_bytes(self, nda_data):
        assert isinstance(generate_pdf(nda_data), bytes)

    def test_nda_is_valid_pdf(self, nda_data):
        assert generate_pdf(nda_data)[:4] == b"%PDF"

    def test_nda_non_empty(self, nda_data):
        assert len(generate_pdf(nda_data)) > 1000

    def test_cloud_service_is_valid_pdf(self, cloud_service_data):
        assert generate_pdf(cloud_service_data)[:4] == b"%PDF"
