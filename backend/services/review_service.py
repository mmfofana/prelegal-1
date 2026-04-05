from __future__ import annotations

import os

from litellm import completion

from document_registry import DOCUMENT_REGISTRY
from schemas.document import PartialDocumentFields
from schemas.review import AiDocumentReview

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


def _build_system_prompt(document_type: str, fields: PartialDocumentFields) -> str:
    doc_def = DOCUMENT_REGISTRY.get(document_type)
    if doc_def is None:
        raise ValueError(f"Unknown document type: {document_type}")

    required_fields = ["effective_date", "governing_law", "jurisdiction", "party1", "party2"]
    for f in doc_def.extra_fields:
        if f.required:
            required_fields.append(f"extra_fields.{f.key}")

    optional_fields = []
    for f in doc_def.extra_fields:
        if not f.required:
            optional_fields.append(f"extra_fields.{f.key}")

    current_state = fields.model_dump(exclude_none=True)

    return f"""You are a legal document reviewer evaluating a {doc_def.display_name} draft.

Required fields for this document:
{chr(10).join(f"  - {f}" for f in required_fields)}

Optional fields:
{chr(10).join(f"  - {f}" for f in optional_fields) or "  (none)"}

Current field values:
{current_state}

Your task:
1. Calculate completeness_score (0-100): percentage of required fields that have non-empty values
2. Identify risks: flag any field values that seem unusual, risky, or legally problematic
   - severity: "high" for serious legal risks, "medium" for notable concerns, "low" for minor issues
   - field: the field name (e.g. "governing_law", "effective_date", "extra_fields.purpose")
   - message: concise plain-English description of the risk
3. Provide 2-5 practical suggestions to improve the document

Be specific and actionable. Focus on real legal risks, not generic advice."""


def review_document(document_type: str, fields: PartialDocumentFields) -> AiDocumentReview:
    if not os.environ.get("OPENROUTER_API_KEY"):
        raise RuntimeError("OPENROUTER_API_KEY environment variable is required")

    doc_def = DOCUMENT_REGISTRY.get(document_type)
    if doc_def is None:
        raise ValueError(f"Unknown document type: {document_type}")

    system_content = _build_system_prompt(document_type, fields)

    response = completion(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Please review this document draft."},
        ],
        response_format=AiDocumentReview,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("LLM returned an empty response")
    return AiDocumentReview.model_validate_json(content)
