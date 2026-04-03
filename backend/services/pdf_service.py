from __future__ import annotations

import os
from datetime import datetime

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")

_jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
)


def _format_date(iso_date: str) -> str:
    """Convert YYYY-MM-DD to 'Month Day, Year'."""
    try:
        d = datetime.strptime(iso_date, "%Y-%m-%d")
        return f"{d.strftime('%B')} {d.day}, {d.year}"
    except ValueError:
        return iso_date


def render_nda_html(data: dict) -> str:
    """Render the NDA Jinja2 template with the given form data."""
    template = _jinja_env.get_template("nda_pdf.html")
    return template.render(
        **data,
        effective_date_formatted=_format_date(data["effective_date"]),
    )


def generate_pdf(data: dict) -> bytes:
    """Render the NDA HTML template and convert to PDF bytes via WeasyPrint."""
    html_string = render_nda_html(data)
    return HTML(string=html_string).write_pdf()
