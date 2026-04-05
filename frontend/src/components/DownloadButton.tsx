"use client";

import { useEffect, useState } from "react";

import { generatePdf } from "@/lib/api";
import { DocumentFormData } from "@/types/document";
import { DocumentTypeDef } from "@/lib/document-registry";

interface DownloadButtonProps {
  data: DocumentFormData;
  docDef: DocumentTypeDef;
  onDownloaded?: () => void;
}

export function DownloadButton({ data, docDef, onDownloaded }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [saved]);

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
      setSaved(true);
      onDownloaded?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "PDF generation failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-[#753991] hover:bg-[#5e2c75] disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
      >
        {loading ? "Generating PDF…" : "Download PDF"}
      </button>
      {saved && (
        <p className="text-xs text-green-400 animate-pulse">Saved to My Documents ✓</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
