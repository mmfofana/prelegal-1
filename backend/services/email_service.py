"""Email delivery service with graceful no-SMTP fallback."""
from __future__ import annotations

import logging
import os
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def _get_smtp_config() -> dict | None:
    host = os.environ.get("SMTP_HOST", "")
    if not host:
        return None
    return {
        "host": host,
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER", ""),
        "password": os.environ.get("SMTP_PASS", ""),
        "from_addr": os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER", "noreply@prelegal.app")),
    }


def _send_email(to_emails: list[str], subject: str, html_body: str, plain_body: str, attachments: list[tuple[str, bytes]] | None = None) -> None:
    """Send an email. Logs warning and returns silently if SMTP is not configured."""
    config = _get_smtp_config()
    if not config:
        logger.warning("SMTP not configured — skipping email to %s (subject: %s)", to_emails, subject)
        return

    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"] = config["from_addr"]
    msg["To"] = ", ".join(to_emails)

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(plain_body, "plain"))
    alt.attach(MIMEText(html_body, "html"))
    msg.attach(alt)

    if attachments:
        for filename, data in attachments:
            part = MIMEApplication(data, Name=filename)
            part["Content-Disposition"] = f'attachment; filename="{filename}"'
            msg.attach(part)

    try:
        with smtplib.SMTP(config["host"], config["port"]) as smtp:
            smtp.ehlo()
            if smtp.has_extn("STARTTLS"):
                smtp.starttls()
                smtp.ehlo()
            if config["user"]:
                smtp.login(config["user"], config["password"])
            smtp.sendmail(config["from_addr"], to_emails, msg.as_string())
        logger.info("Email sent to %s: %s", to_emails, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to_emails)


def send_signing_invite(
    to_email: str,
    signatory_name: str,
    doc_title: str,
    sign_url: str,
) -> None:
    plain = (
        f"Hi {signatory_name},\n\n"
        f"You have been invited to sign: {doc_title}\n\n"
        f"Click the link below to review and sign the document:\n{sign_url}\n\n"
        "This link expires in 7 days.\n\n"
        "— Prelegal"
    )
    html = (
        f"<p>Hi {signatory_name},</p>"
        f"<p>You have been invited to sign: <strong>{doc_title}</strong></p>"
        f'<p><a href="{sign_url}" style="background:#753991;color:white;padding:10px 20px;'
        f'border-radius:6px;text-decoration:none;font-weight:bold;">Review &amp; Sign</a></p>'
        f"<p>Or copy this link: {sign_url}</p>"
        "<p>This link expires in 7 days.</p>"
        "<p>— Prelegal</p>"
    )
    _send_email([to_email], f"Please sign: {doc_title}", html, plain)


def send_completion_email(
    to_emails: list[str],
    doc_title: str,
    pdf_bytes: bytes,
) -> None:
    plain = (
        f"All parties have signed: {doc_title}\n\n"
        "The fully executed document is attached.\n\n"
        "— Prelegal"
    )
    html = (
        f"<p>All parties have signed: <strong>{doc_title}</strong></p>"
        "<p>The fully executed document is attached to this email.</p>"
        "<p>— Prelegal</p>"
    )
    _send_email(
        to_emails,
        f"Fully executed: {doc_title}",
        html,
        plain,
        attachments=[("signed-document.pdf", pdf_bytes)],
    )
