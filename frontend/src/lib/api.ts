import { DocumentFormData } from "@/types/document";

export async function generatePdf(data: DocumentFormData): Promise<Blob> {
  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`PDF generation failed: ${response.status} ${text}`);
  }

  return response.blob();
}

export async function generateDocx(data: DocumentFormData): Promise<Blob> {
  const response = await fetch("/api/generate-docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`DOCX generation failed: ${response.status} ${text}`);
  }

  return response.blob();
}
