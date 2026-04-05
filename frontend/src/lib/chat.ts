import { DocumentFormData, Party } from "@/types/document";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PartialParty {
  company?: string | null;
  name?: string | null;
  title?: string | null;
  address?: string | null;
}

export interface PartialDocumentFields {
  effective_date?: string | null;
  governing_law?: string | null;
  jurisdiction?: string | null;
  party1?: PartialParty | null;
  party2?: PartialParty | null;
  extra_fields?: Record<string, string | null> | null;
}

export interface ChatApiResponse {
  reply: string;
  fields: PartialDocumentFields;
}

export async function sendMessage(
  documentType: string,
  messages: ChatMessage[],
  currentFields: DocumentFormData,
): Promise<ChatApiResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      document_type: documentType,
      messages,
      current_fields: {
        effective_date: currentFields.effective_date || null,
        governing_law: currentFields.governing_law || null,
        jurisdiction: currentFields.jurisdiction || null,
        party1: currentFields.party1,
        party2: currentFields.party2,
        extra_fields: currentFields.extra_fields,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Chat request failed");
  }
  return res.json() as Promise<ChatApiResponse>;
}

function mergeParty(current: Party, partial: PartialParty): Party {
  return {
    company: partial.company != null ? partial.company : current.company,
    name: partial.name != null ? partial.name : current.name,
    title: partial.title != null ? partial.title : current.title,
    address: partial.address != null ? partial.address : current.address,
  };
}

export function mergeFields(
  current: DocumentFormData,
  partial: PartialDocumentFields,
): DocumentFormData {
  const updated = { ...current };

  if (partial.effective_date != null) updated.effective_date = partial.effective_date;
  if (partial.governing_law != null) updated.governing_law = partial.governing_law;
  if (partial.jurisdiction != null) updated.jurisdiction = partial.jurisdiction;

  if (partial.party1 != null) {
    updated.party1 = mergeParty(current.party1, partial.party1);
  }
  if (partial.party2 != null) {
    updated.party2 = mergeParty(current.party2, partial.party2);
  }

  if (partial.extra_fields != null) {
    const merged: Record<string, string> = { ...current.extra_fields };
    for (const [key, value] of Object.entries(partial.extra_fields)) {
      if (value != null) {
        merged[key] = value;
      }
    }
    updated.extra_fields = merged;
  }

  return updated;
}
