"use client";

import { useState } from "react";

import { generateDocx } from "@/lib/api";
import { DocumentFormData } from "@/types/document";
import { DocumentTypeDef } from "@/lib/document-registry";

interface DownloadDocxButtonProps {
  data: DocumentFormData;
  docDef: DocumentTypeDef;
}

export function DownloadDocxButton({ data, docDef }: DownloadDocxButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await generateDocx(data);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = docDef.pdfFilename.replace(".pdf", ".docx");
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "DOCX generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-white/10 hover:bg-white/20 border border-white/30 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {loading ? "Generating…" : "Download DOCX"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
