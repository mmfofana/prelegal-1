export interface ExplainClauseResponse {
  explanation: string;
  risks: string[];
}

export async function explainClause(
  clauseText: string,
  documentType: string,
): Promise<ExplainClauseResponse> {
  const res = await fetch("/api/explain-clause", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ clause_text: clauseText, document_type: documentType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to explain clause");
  }
  return res.json() as Promise<ExplainClauseResponse>;
}
