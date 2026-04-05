"use client";

import { useEffect, useState } from "react";

import { DocumentPreview } from "@/components/DocumentPreview";
import { DOCUMENT_REGISTRY } from "@/lib/document-registry";
import { SigningPageDocument, fetchSignPage, submitSignature } from "@/lib/share";
import { DocumentFormData, defaultDocumentFormData } from "@/types/document";

interface SigningPageProps {
  token: string;
}

export function SigningPage({ token }: SigningPageProps) {
  const [doc, setDoc] = useState<SigningPageDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedName, setSignedName] = useState("");
  const [signedTitle, setSignedTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [allSigned, setAllSigned] = useState(false);

  useEffect(() => {
    fetchSignPage(token)
      .then((d) => {
        setDoc(d);
        setSignedName(d.signatory_name);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Not found"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSign = async () => {
    setSubmitting(true);
    try {
      const result = await submitSignature(token, signedName, signedTitle);
      setSigned(true);
      setAllSigned(result.all_signed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#032147] text-white px-6 py-4 shadow-md">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-[#ecad0a]">Pre</span>legal
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400">Loading…</div>
        )}

        {error && !signed && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-6 py-8 text-center max-w-lg mx-auto">
            <p className="font-semibold text-lg mb-2">Link not available</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {signed && (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-6 py-8 text-center max-w-lg mx-auto">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-semibold text-lg mb-2">Document signed successfully</p>
            {allSigned ? (
              <p className="text-sm">All parties have signed. You will receive a copy by email.</p>
            ) : (
              <p className="text-sm">
                Your signature has been recorded. You will receive a copy by email once all parties have signed.
              </p>
            )}
          </div>
        )}

        {doc && !signed && (() => {
          const docDef = DOCUMENT_REGISTRY[doc.document_type];
          if (!docDef) return <p className="text-red-600">Unknown document type</p>;

          const formData = {
            ...defaultDocumentFormData(doc.document_type),
            ...doc.fields,
          } as DocumentFormData;

          return (
            <div className="flex gap-6">
              {/* Document preview */}
              <div className="flex-1 bg-white shadow-sm rounded-lg p-8 border border-gray-100">
                <DocumentPreview data={formData} docDef={docDef} />
              </div>

              {/* Signing panel */}
              <aside className="w-80 shrink-0">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-6">
                  <h2 className="font-bold text-[#032147] mb-1">{doc.title}</h2>
                  <p className="text-xs text-gray-400 mb-4">
                    Signing as: <strong>{doc.signatory_role}</strong>
                  </p>

                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#032147] mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={signedName}
                        onChange={(e) => setSignedName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#753991]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#032147] mb-1">
                        Title / Position
                      </label>
                      <input
                        type="text"
                        value={signedTitle}
                        onChange={(e) => setSignedTitle(e.target.value)}
                        placeholder="e.g. CEO"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#753991]"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-4">
                    By clicking "Sign Document", you agree that this electronic signature is legally binding.
                  </p>

                  <button
                    onClick={handleSign}
                    disabled={submitting || !signedName.trim()}
                    className="w-full bg-[#753991] hover:bg-[#5e2d73] text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Signing…" : "Sign Document"}
                  </button>

                  {error && (
                    <p className="text-xs text-red-600 mt-2">{error}</p>
                  )}
                </div>
              </aside>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
