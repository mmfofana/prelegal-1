import { DocumentFormData } from "@/types/document";

export interface DocumentVersionSummary {
  id: number;
  version_number: number;
  created_at: string;
}

export interface DocumentVersionDetail extends DocumentVersionSummary {
  fields: DocumentFormData;
}

export async function listVersions(docId: number): Promise<DocumentVersionSummary[]> {
  const res = await fetch(`/api/documents/${docId}/versions`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load versions");
  return res.json() as Promise<DocumentVersionSummary[]>;
}

export async function getVersion(
  docId: number,
  versionNumber: number,
): Promise<DocumentVersionDetail> {
  const res = await fetch(`/api/documents/${docId}/versions/${versionNumber}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load version");
  return res.json() as Promise<DocumentVersionDetail>;
}
