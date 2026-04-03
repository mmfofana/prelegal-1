import os

from litellm import completion

from schemas.chat import AiChatOutput, ChatMessage, PartialNdaFields

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

_SYSTEM_PROMPT = """You are a legal document assistant helping users draft a Mutual Non-Disclosure Agreement (MNDA).

Your role:
- Let the user describe what they need in their own words
- Extract NDA field values from their description with confidence
- Ask friendly follow-up questions about missing required fields (1-3 at a time, not all at once)
- Be conversational and concise

The MNDA has these fields to collect:
- purpose: How confidential information may be used (e.g. "evaluating a potential business partnership")
- effective_date: When the NDA takes effect — use YYYY-MM-DD format (e.g. "2026-04-03")
- mnda_term_type: "expires" (lasts a fixed number of years) or "continues" (until terminated by either party)
- mnda_term_years: If mnda_term_type is "expires", how many years (positive integer)
- term_of_confidentiality_type: "years" (confidentiality lasts N years) or "perpetuity" (lasts forever)
- term_of_confidentiality_years: If term_of_confidentiality_type is "years", how many (positive integer)
- governing_law: Which state's laws govern the agreement (e.g. "Delaware")
- jurisdiction: Where disputes are resolved (e.g. "courts located in New Castle, DE")
- modifications: Any changes to standard NDA terms — omit or set null if none
- party1: First party — company name, representative name, title, notice address (email or postal)
- party2: Second party — same fields as party1

In your structured response:
- reply: Your conversational message to the user (friendly, concise)
- fields: Only set fields you are CONFIDENT about from this conversation. Use null for unknown or unclear fields. Never guess.

If the user mentions both parties' names in one message, extract both. If they mention an effective date like "today" or "immediately", use today's date."""


def get_ai_response(messages: list[ChatMessage], current_fields: PartialNdaFields) -> AiChatOutput:
    if not os.environ.get("OPENROUTER_API_KEY"):
        raise RuntimeError("OPENROUTER_API_KEY environment variable is required")

    system_content = _SYSTEM_PROMPT + f"\n\nCurrent document state: {current_fields.model_dump(exclude_none=True)}"

    litellm_messages = [
        {"role": "system", "content": system_content},
        *[{"role": m.role, "content": m.content} for m in messages],
    ]

    response = completion(
        model=MODEL,
        messages=litellm_messages,
        response_format=AiChatOutput,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("LLM returned an empty response")
    return AiChatOutput.model_validate_json(content)
