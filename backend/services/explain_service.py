from __future__ import annotations

import os

from litellm import completion

from document_registry import DOCUMENT_REGISTRY
from schemas.explain import AiClauseExplanation

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


def _build_system_prompt(clause_text: str, document_type: str) -> str:
    doc_def = DOCUMENT_REGISTRY.get(document_type)
    doc_name = doc_def.display_name if doc_def else document_type
    return (
        f"You are a legal document assistant explaining clauses from a {doc_name}.\n\n"
        "Your role:\n"
        "- Explain the following clause in 2-3 sentences of plain English suitable for a non-lawyer\n"
        "- List any practical risks or negotiation points a party should know about (3-5 concise bullet points)\n"
        "- Be specific to the clause text, not generic\n"
        "- Avoid legal jargon; write as you would explain to a smart business person\n\n"
        f"Clause to explain:\n{clause_text}"
    )


def explain_clause(clause_text: str, document_type: str) -> AiClauseExplanation:
    if not os.environ.get("OPENROUTER_API_KEY"):
        raise RuntimeError("OPENROUTER_API_KEY environment variable is required")

    doc_def = DOCUMENT_REGISTRY.get(document_type)
    if doc_def is None:
        raise ValueError(f"Unknown document type: {document_type}")

    system_content = _build_system_prompt(clause_text, document_type)

    response = completion(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Please explain this clause."},
        ],
        response_format=AiClauseExplanation,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("LLM returned an empty response")
    return AiClauseExplanation.model_validate_json(content)
