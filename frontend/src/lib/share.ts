export interface ShareLinkResponse {
  token: string;
  url: string;
}

export interface SharedDocumentResponse {
  document_type: string;
  title: string;
  fields: Record<string, unknown>;
}

export interface SignatoryInput {
  email: string;
  name: string;
  role: string;
}

export interface SigningRequestStatus {
  id: number;
  email: string;
  name: string;
  role: string;
  signed_at: string | null;
}

export interface SigningSessionStatus {
  id: number;
  status: string;
  created_at: string;
  expires_at: string;
  requests: SigningRequestStatus[];
}

export interface SigningPageDocument {
  document_type: string;
  title: string;
  fields: Record<string, unknown>;
  signatory_name: string;
  signatory_role: string;
  session_status: string;
}

export async function createShareLink(docId: number): Promise<ShareLinkResponse> {
  const res = await fetch(`/api/documents/${docId}/share`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to create share link");
  }
  return res.json() as Promise<ShareLinkResponse>;
}

export async function fetchSharedDocument(token: string): Promise<SharedDocumentResponse> {
  const res = await fetch(`/api/share/${token}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Share link not found or expired");
  }
  return res.json() as Promise<SharedDocumentResponse>;
}

export async function createSigningSession(
  docId: number,
  signatories: SignatoryInput[],
): Promise<SigningSessionStatus> {
  const res = await fetch(`/api/documents/${docId}/signing-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ signatories }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to send signing invites");
  }
  return res.json() as Promise<SigningSessionStatus>;
}

export async function fetchSignPage(token: string): Promise<SigningPageDocument> {
  const res = await fetch(`/api/sign/${token}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Signing link not found or expired");
  }
  return res.json() as Promise<SigningPageDocument>;
}

export async function submitSignature(
  token: string,
  signedName: string,
  signedTitle: string,
): Promise<{ status: string; all_signed: boolean }> {
  const res = await fetch(`/api/sign/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signed_name: signedName, signed_title: signedTitle }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to submit signature");
  }
  return res.json() as Promise<{ status: string; all_signed: boolean }>;
}
