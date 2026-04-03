import { NdaFormData } from "@/types/nda";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PartialNdaParty {
  company?: string | null;
  name?: string | null;
  title?: string | null;
  address?: string | null;
}

export interface PartialNdaFields {
  purpose?: string | null;
  effective_date?: string | null;
  mnda_term_type?: "expires" | "continues" | null;
  mnda_term_years?: number | null;
  term_of_confidentiality_type?: "years" | "perpetuity" | null;
  term_of_confidentiality_years?: number | null;
  governing_law?: string | null;
  jurisdiction?: string | null;
  modifications?: string | null;
  party1?: PartialNdaParty | null;
  party2?: PartialNdaParty | null;
}

export interface ChatApiResponse {
  reply: string;
  fields: PartialNdaFields;
}

export async function sendMessage(
  messages: ChatMessage[],
  currentFields: NdaFormData
): Promise<ChatApiResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ messages, current_fields: currentFields }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Chat request failed");
  }
  return res.json() as Promise<ChatApiResponse>;
}

export function mergeFields(current: NdaFormData, partial: PartialNdaFields): NdaFormData {
  const updated = { ...current };

  if (partial.purpose != null) updated.purpose = partial.purpose;
  if (partial.effective_date != null) updated.effective_date = partial.effective_date;
  if (partial.governing_law != null) updated.governing_law = partial.governing_law;
  if (partial.jurisdiction != null) updated.jurisdiction = partial.jurisdiction;
  if (partial.modifications != null) updated.modifications = partial.modifications;

  if (partial.mnda_term_type != null || partial.mnda_term_years != null) {
    updated.mnda_term = {
      ...current.mnda_term,
      ...(partial.mnda_term_type != null ? { type: partial.mnda_term_type } : {}),
      ...(partial.mnda_term_years != null ? { years: partial.mnda_term_years } : {}),
    };
  }

  if (partial.term_of_confidentiality_type != null || partial.term_of_confidentiality_years != null) {
    updated.term_of_confidentiality = {
      ...current.term_of_confidentiality,
      ...(partial.term_of_confidentiality_type != null
        ? { type: partial.term_of_confidentiality_type }
        : {}),
      ...(partial.term_of_confidentiality_years != null
        ? { years: partial.term_of_confidentiality_years }
        : {}),
    };
  }

  if (partial.party1 != null) {
    updated.party1 = {
      ...current.party1,
      ...(partial.party1.company != null ? { company: partial.party1.company } : {}),
      ...(partial.party1.name != null ? { name: partial.party1.name } : {}),
      ...(partial.party1.title != null ? { title: partial.party1.title } : {}),
      ...(partial.party1.address != null ? { address: partial.party1.address } : {}),
    };
  }

  if (partial.party2 != null) {
    updated.party2 = {
      ...current.party2,
      ...(partial.party2.company != null ? { company: partial.party2.company } : {}),
      ...(partial.party2.name != null ? { name: partial.party2.name } : {}),
      ...(partial.party2.title != null ? { title: partial.party2.title } : {}),
      ...(partial.party2.address != null ? { address: partial.party2.address } : {}),
    };
  }

  return updated;
}
