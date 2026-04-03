"use client";

import { useState } from "react";

import { generatePdf } from "@/lib/api";
import { DocumentFormData } from "@/types/document";
import { DocumentTypeDef } from "@/lib/document-registry";

interface DownloadButtonProps {
  data: DocumentFormData;
  docDef: DocumentTypeDef;
}

export function DownloadButton({ data, docDef }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await generatePdf(data);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = docDef.pdfFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "PDF generation failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-[#753991] hover:bg-[#5e2c75] disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
      >
        {loading ? "Generating PDF…" : "Download PDF"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
