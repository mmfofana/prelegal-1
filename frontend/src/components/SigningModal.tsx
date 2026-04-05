"use client";

import { useState } from "react";

import { SignatoryInput, createSigningSession } from "@/lib/share";

interface SigningModalProps {
  docId: number;
  docTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY_SIGNATORY: SignatoryInput = { email: "", name: "", role: "" };

export function SigningModal({ docId, docTitle, onClose, onSuccess }: SigningModalProps) {
  const [signatories, setSignatories] = useState<SignatoryInput[]>([
    { ...EMPTY_SIGNATORY },
    { ...EMPTY_SIGNATORY },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSignatory = (index: number, field: keyof SignatoryInput, value: string) => {
    setSignatories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const addSignatory = () => {
    if (signatories.length < 10) {
      setSignatories((prev) => [...prev, { ...EMPTY_SIGNATORY }]);
    }
  };

  const removeSignatory = (index: number) => {
    if (signatories.length > 1) {
      setSignatories((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    const valid = signatories.filter((s) => s.email.trim() && s.name.trim() && s.role.trim());
    if (valid.length === 0) {
      setError("At least one signatory with email, name, and role is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createSigningSession(docId, valid);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send signing invites");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#032147]">Send for Signing</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          <strong>{docTitle}</strong> — each signatory will receive an email with a link to sign.
        </p>

        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
          {signatories.map((s, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 relative">
              <span className="text-xs font-semibold text-gray-400 mb-2 block">
                Signatory {i + 1}
              </span>
              {signatories.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSignatory(i)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              )}
              <div className="space-y-2">
                {(["email", "name", "role"] as const).map((field) => (
                  <input
                    key={field}
                    type={field === "email" ? "email" : "text"}
                    value={s[field]}
                    onChange={(e) => updateSignatory(i, field, e.target.value)}
                    placeholder={
                      field === "email" ? "Email address" :
                      field === "name" ? "Full name" : "Role (e.g. Party 1)"
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {signatories.length < 10 && (
          <button
            type="button"
            onClick={addSignatory}
            className="text-xs text-[#209dd7] hover:underline mb-4 block"
          >
            + Add another signatory
          </button>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#753991] hover:bg-[#5e2d73] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send Signing Invites"}
          </button>
        </div>
      </div>
    </div>
  );
}
