from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

import markdown as md_lib
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

from document_registry import DOCUMENT_REGISTRY

COVER_TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")
MARKDOWN_TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"

_jinja_env = Environment(
    loader=FileSystemLoader(COVER_TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
)


def _format_date(iso_date: str) -> str:
    """Convert YYYY-MM-DD to 'Month Day, Year'."""
    try:
        d = datetime.strptime(iso_date, "%Y-%m-%d")
        return f"{d.strftime('%B')} {d.day}, {d.year}"
    except ValueError:
        return iso_date


def _convert_markdown_to_html(filename: str) -> str:
    """Read a markdown template file and convert to HTML for PDF inclusion."""
    path = MARKDOWN_TEMPLATES_DIR / filename
    md_content = path.read_text(encoding="utf-8")
    return md_lib.markdown(md_content, extensions=["extra", "sane_lists"])


def render_document_html(data: dict) -> str:
    """Render a complete PDF HTML document for the given document type."""
    document_type = data["document_type"]
    doc_def = DOCUMENT_REGISTRY.get(document_type)
    if doc_def is None:
        raise ValueError(f"Unknown document type: {document_type}")

    extra = data.get("extra_fields", {})
    terms_html = _convert_markdown_to_html(doc_def.markdown_template)

    template = _jinja_env.get_template(doc_def.pdf_cover_template)
    return template.render(
        document_type=document_type,
        effective_date=data["effective_date"],
        effective_date_formatted=_format_date(data["effective_date"]),
        governing_law=data["governing_law"],
        jurisdiction=data["jurisdiction"],
        party1=data["party1"],
        party2=data["party2"],
        extra=extra,
        terms_html=terms_html,
        doc_def=doc_def,
    )


def generate_pdf(data: dict) -> bytes:
    """Render the HTML template and convert to PDF bytes via WeasyPrint."""
    html_string = render_document_html(data)
    return HTML(string=html_string).write_pdf()


# ── Backward-compatible alias used by existing tests ────────────────────────────
def render_nda_html(data: dict) -> str:
    """Render NDA HTML — wraps render_document_html for backward compatibility."""
    # Accept both old format (flat NDA fields) and new format (document_type + extra_fields)
    if "document_type" not in data:
        data = _migrate_nda_payload(data)
    return render_document_html(data)


def _migrate_nda_payload(data: dict) -> dict:
    """Convert old-style flat NDA payload to new generic format."""
    mnda_term = data.get("mnda_term", {})
    toc = data.get("term_of_confidentiality", {})
    return {
        "document_type": "mutual-nda",
        "effective_date": data["effective_date"],
        "governing_law": data["governing_law"],
        "jurisdiction": data["jurisdiction"],
        "party1": data["party1"],
        "party2": data["party2"],
        "extra_fields": {
            "purpose": data.get("purpose", ""),
            "mnda_term_type": mnda_term.get("type", "expires"),
            "mnda_term_years": str(mnda_term.get("years") or ""),
            "term_of_confidentiality_type": toc.get("type", "years"),
            "term_of_confidentiality_years": str(toc.get("years") or ""),
            "modifications": data.get("modifications", ""),
        },
    }
