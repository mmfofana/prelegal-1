import { PartialDocumentFields } from "@/lib/chat";

export type RiskSeverity = "high" | "medium" | "low";

export interface ReviewRisk {
  severity: RiskSeverity;
  field: string;
  message: string;
}

export interface DocumentReviewResponse {
  completeness_score: number;
  risks: ReviewRisk[];
  suggestions: string[];
}

export async function reviewDocument(
  documentType: string,
  fields: PartialDocumentFields,
): Promise<DocumentReviewResponse> {
  const res = await fetch("/api/review-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ document_type: documentType, fields }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to review document");
  }
  return res.json() as Promise<DocumentReviewResponse>;
}
