"use client";

import { useEffect, useState } from "react";

import { DocumentPreview } from "@/components/DocumentPreview";
import { DOCUMENT_REGISTRY } from "@/lib/document-registry";
import { SharedDocumentResponse, fetchSharedDocument } from "@/lib/share";
import { DocumentFormData, defaultDocumentFormData } from "@/types/document";

interface ShareViewerProps {
  token: string;
}

export function ShareViewer({ token }: ShareViewerProps) {
  const [doc, setDoc] = useState<SharedDocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedDocument(token)
      .then(setDoc)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Not found"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#032147] text-white px-6 py-4 shadow-md">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-[#ecad0a]">Pre</span>legal
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400">Loading…</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-6 py-8 text-center">
            <p className="font-semibold text-lg mb-2">Link not found or expired</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {doc && (() => {
          const docDef = DOCUMENT_REGISTRY[doc.document_type];
          if (!docDef) return <p className="text-red-600">Unknown document type</p>;

          const formData = { ...defaultDocumentFormData(doc.document_type), ...doc.fields } as DocumentFormData;

          return (
            <>
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#209dd7]/30 bg-[#209dd7]/5 px-4 py-2 text-xs text-[#209dd7]">
                <span>👁</span>
                <span>Read-only shared view — <strong>{doc.title}</strong></span>
              </div>
              <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-100">
                <DocumentPreview data={formData} docDef={docDef} />
              </div>
            </>
          );
        })()}
      </main>
    </div>
  );
}
