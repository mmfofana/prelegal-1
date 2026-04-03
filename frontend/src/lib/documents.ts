import { DocumentFormData } from "@/types/document";

export interface SavedDocumentSummary {
  id: number;
  document_type: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SavedDocumentDetail extends SavedDocumentSummary {
  fields: DocumentFormData;
}

export async function listDocuments(): Promise<SavedDocumentSummary[]> {
  const r = await fetch("/api/documents", { credentials: "include" });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? "Failed to load documents");
  }
  return r.json();
}

export async function fetchDocument(id: number): Promise<SavedDocumentDetail> {
  const r = await fetch(`/api/documents/${id}`, { credentials: "include" });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? "Document not found");
  }
  return r.json();
}

export async function deleteDocument(id: number): Promise<void> {
  const r = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? "Failed to delete document");
  }
}
