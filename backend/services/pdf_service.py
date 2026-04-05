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


def render_signed_document_html(data: dict, session: object, requests: list) -> str:
    """Render HTML for a fully signed document, appending a signatures section."""
    base_html = render_document_html(data)

    sig_rows = ""
    for req in requests:
        signed_at_str = ""
        if getattr(req, "signed_at", None):
            signed_at_str = req.signed_at.strftime("%Y-%m-%d %H:%M UTC")
        sig_rows += (
            f"<tr>"
            f"<td style='border:1px solid #ddd;padding:8px'>{req.name}</td>"
            f"<td style='border:1px solid #ddd;padding:8px'>{getattr(req, 'signed_title', '') or ''}</td>"
            f"<td style='border:1px solid #ddd;padding:8px'>{req.email}</td>"
            f"<td style='border:1px solid #ddd;padding:8px'>{req.role}</td>"
            f"<td style='border:1px solid #ddd;padding:8px'>{signed_at_str}</td>"
            f"<td style='border:1px solid #ddd;padding:8px'>{getattr(req, 'ip_address', '') or ''}</td>"
            f"</tr>"
        )

    created_at_str = ""
    if getattr(session, "created_at", None):
        created_at_str = session.created_at.strftime("%Y-%m-%d %H:%M UTC")

    signatures_section = f"""
<div style="page-break-before:always;font-family:sans-serif;font-size:11px;margin-top:40px">
  <h2 style="color:#032147;border-bottom:2px solid #209dd7;padding-bottom:6px">Signature Certificate</h2>
  <p>This document was electronically signed on {created_at_str}.</p>
  <table style="width:100%;border-collapse:collapse;font-size:10px">
    <thead>
      <tr style="background:#032147;color:white">
        <th style="border:1px solid #ddd;padding:8px;text-align:left">Name</th>
        <th style="border:1px solid #ddd;padding:8px;text-align:left">Title</th>
        <th style="border:1px solid #ddd;padding:8px;text-align:left">Email</th>
        <th style="border:1px solid #ddd;padding:8px;text-align:left">Role</th>
        <th style="border:1px solid #ddd;padding:8px;text-align:left">Signed At</th>
        <th style="border:1px solid #ddd;padding:8px;text-align:left">IP Address</th>
      </tr>
    </thead>
    <tbody>{sig_rows}</tbody>
  </table>
  <p style="margin-top:16px;color:#888;font-size:9px">
    Electronic signatures are legally binding under UETA and ESIGN Act.
    This certificate serves as an audit trail for the signing process.
  </p>
</div>
"""

    return base_html.replace("</body>", signatures_section + "</body>")


def generate_signed_pdf(data: dict, session: object, requests: list) -> bytes:
    """Generate a PDF with a signature certificate appended."""
    html_string = render_signed_document_html(data, session, requests)
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
