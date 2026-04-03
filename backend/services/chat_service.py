from __future__ import annotations

import os
from datetime import date

from litellm import completion

from document_registry import DOCUMENT_REGISTRY, DocumentTypeDef
from schemas.document import AiDocumentOutput, ChatMessage, PartialDocumentFields

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

_SUPPORTED_SLUGS = ", ".join(
    d for d in DOCUMENT_REGISTRY if d != "mutual-nda-coverpage"
)


def _build_system_prompt(doc_def: DocumentTypeDef, current_fields: PartialDocumentFields) -> str:
    today = date.today().isoformat()

    field_lines = []
    # Common fields present for every document
    field_lines.append(f"- effective_date: When the agreement takes effect — use YYYY-MM-DD format (today is {today})")
    field_lines.append(f"- governing_law: Which state's or country's laws govern the agreement (e.g. 'Delaware')")
    field_lines.append(f"- jurisdiction: Where disputes are resolved (e.g. 'courts located in New Castle, DE')")
    field_lines.append(f"- party1: The {doc_def.party1_label} — company name, representative name, title, notice address")
    field_lines.append(f"- party2: The {doc_def.party2_label} — same fields as party1")

    # Document-specific extra fields
    for f in doc_def.extra_fields:
        opt_hint = ""
        if f.options:
            opt_hint = f" — must be one of: {', '.join(repr(o) for o in f.options)}"
        req_hint = "" if f.required else " (optional)"
        field_lines.append(f"- extra_fields.{f.key}: {f.description}{opt_hint}{req_hint}")

    fields_section = "\n".join(field_lines)
    current_state = current_fields.model_dump(exclude_none=True)

    supported_docs = "\n".join(f"  - {slug}" for slug in DOCUMENT_REGISTRY if slug != "mutual-nda-coverpage")

    return f"""You are a legal document assistant helping users draft a {doc_def.display_name}.

Your role:
- Listen to what the user needs and extract field values from their description
- Ask friendly follow-up questions about missing required fields (1–3 at a time, never all at once)
- Always ask at least one follow-up question if any required fields are still unknown
- Be conversational, concise, and helpful
- If the user asks about a document type we don't support, explain that politely, then suggest the closest available type and offer to help with that instead

Supported document types:
{supported_docs}

Fields to collect for this {doc_def.display_name}:
{fields_section}

In your structured response:
- reply: Your conversational message to the user (friendly, concise, always include a follow-up question if any required fields are missing)
- fields: Only set fields you are CONFIDENT about from this conversation. Use null for unknown or unclear fields. Never guess.
  - For extra_fields: use a flat dict mapping field keys to string values (or null if unknown){" - If mnda_term_type is 'continues', set mnda_term_years to null" if doc_def.slug in ("mutual-nda", "mutual-nda-coverpage") else ""}

Current document state: {current_state}"""


def get_ai_response(
    document_type: str,
    messages: list[ChatMessage],
    current_fields: PartialDocumentFields,
) -> AiDocumentOutput:
    if not os.environ.get("OPENROUTER_API_KEY"):
        raise RuntimeError("OPENROUTER_API_KEY environment variable is required")

    doc_def = DOCUMENT_REGISTRY.get(document_type)
    if doc_def is None:
        raise ValueError(f"Unknown document type: {document_type}")

    system_content = _build_system_prompt(doc_def, current_fields)

    litellm_messages = [
        {"role": "system", "content": system_content},
        *[{"role": m.role, "content": m.content} for m in messages],
    ]

    response = completion(
        model=MODEL,
        messages=litellm_messages,
        response_format=AiDocumentOutput,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("LLM returned an empty response")
    return AiDocumentOutput.model_validate_json(content)
