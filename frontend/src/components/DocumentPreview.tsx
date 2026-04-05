"use client";

import { useState } from "react";

import { DocumentFormData } from "@/types/document";
import { DocumentTypeDef } from "@/lib/document-registry";
import { ExplainClauseResponse, explainClause } from "@/lib/explain";

// Static descriptions for each section — sent to AI for context
const SECTION_DESCRIPTIONS: Record<string, string> = {
  "Cover Page":
    "The cover page defines the parties, effective date, governing law, jurisdiction, and document-specific terms.",
  "Standard Terms":
    "The standard terms are the legal boilerplate that forms the main body of the agreement, including obligations, limitations, termination rights, and dispute resolution.",
};

interface TooltipState {
  sectionId: string;
  loading: boolean;
  result: ExplainClauseResponse | null;
  error: string | null;
}

function ClauseTooltip({
  state,
  onClose,
}: {
  state: TooltipState;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-xs font-sans not-italic">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-[#032147]">Plain-English Explanation</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 text-base leading-none">
          ×
        </button>
      </div>
      {state.loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-3 h-3 border border-[#209dd7] border-t-transparent rounded-full animate-spin" />
          <span>Explaining…</span>
        </div>
      )}
      {state.error && <p className="text-red-600">{state.error}</p>}
      {state.result && (
        <>
          <p className="text-gray-700 mb-2">{state.result.explanation}</p>
          {state.result.risks.length > 0 && (
            <div>
              <p className="font-semibold text-[#032147] mb-1">Risks to consider:</p>
              <ul className="space-y-0.5">
                {state.result.risks.map((r, i) => (
                  <li key={i} className="flex gap-1.5 text-amber-800">
                    <span className="shrink-0">⚠</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "[Effective Date]";
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function Field({ value, fallback }: { value: string; fallback: string }) {
  if (value.trim()) {
    return <strong className="text-[#032147]">{value}</strong>;
  }
  return (
    <span className="bg-yellow-100 text-yellow-800 rounded px-1 text-xs italic">
      {fallback}
    </span>
  );
}

function FieldRow({ label, value, fallback }: { label: string; value: string; fallback: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">{label}</div>
      <div><Field value={value} fallback={fallback} /></div>
    </div>
  );
}

interface DocumentPreviewProps {
  data: DocumentFormData;
  docDef: DocumentTypeDef;
}

export function DocumentPreview({ data, docDef }: DocumentPreviewProps) {
  const jurisdictionLabel = docDef.jurisdictionLabel ?? "Jurisdiction";
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleExplain = async (sectionId: string) => {
    if (tooltip?.sectionId === sectionId && !tooltip.loading) {
      setTooltip(null);
      return;
    }
    const clauseText =
      SECTION_DESCRIPTIONS[sectionId] ??
      `${sectionId} section of a ${docDef.displayName}.`;

    setTooltip({ sectionId, loading: true, result: null, error: null });
    try {
      const result = await explainClause(clauseText, docDef.slug);
      setTooltip({ sectionId, loading: false, result, error: null });
    } catch (err: unknown) {
      setTooltip({
        sectionId,
        loading: false,
        result: null,
        error: err instanceof Error ? err.message : "Failed to explain",
      });
    }
  };

  return (
    <div className="font-serif text-[13px] text-gray-800 leading-relaxed space-y-5">
      {/* Draft disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 not-italic font-sans">
        <span className="shrink-0 mt-0.5">⚠</span>
        <p>
          <strong>Draft preview only.</strong> This document should be considered a draft and is subject to legal review. Consult qualified counsel before use.
        </p>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#032147] mb-1">{docDef.displayName}</h1>
        <p className="text-xs text-[#888888]">
          This agreement consists of this Cover Page and the Common Paper {docDef.displayName} Standard Terms.
        </p>
      </div>

      {/* Cover Page */}
      <section>
        <div className="relative">
          <div className="flex items-center gap-2 border-b-2 border-[#209dd7] pb-1 mb-3">
            <h2 className="text-base font-bold text-[#032147]">Cover Page</h2>
            <button
              onClick={() => handleExplain("Cover Page")}
              className="text-[#209dd7] hover:text-[#1a85b8] text-xs leading-none font-sans not-italic"
              title="Explain this section"
            >
              ⓘ
            </button>
          </div>
          {tooltip?.sectionId === "Cover Page" && (
            <ClauseTooltip state={tooltip} onClose={() => setTooltip(null)} />
          )}
        </div>

        <div className="space-y-3">
          {/* Document-specific extra fields */}
          {docDef.extraFields.map((fieldDef) => {
            const value = data.extra_fields[fieldDef.key] ?? "";

            // Special rendering for NDA term fields
            if (fieldDef.key === "mnda_term_type") {
              const termType = value || "expires";
              const years = data.extra_fields["mnda_term_years"] || "1";
              return (
                <div key={fieldDef.key}>
                  <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">MNDA Term</div>
                  {termType === "expires" ? (
                    <div>
                      <span className="text-[#209dd7]">☑</span>{" "}
                      Expires {years} year(s) from Effective Date.
                      <br />
                      <span className="text-gray-400">☐</span>{" "}
                      <span className="text-gray-400">Continues until terminated.</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-gray-400">☐</span>{" "}
                      <span className="text-gray-400">Expires [N] year(s) from Effective Date.</span>
                      <br />
                      <span className="text-[#209dd7]">☑</span>{" "}
                      Continues until terminated.
                    </div>
                  )}
                </div>
              );
            }
            if (fieldDef.key === "mnda_term_years") return null; // rendered above
            if (fieldDef.key === "term_of_confidentiality_type") {
              const confType = value || "years";
              const years = data.extra_fields["term_of_confidentiality_years"] || "1";
              return (
                <div key={fieldDef.key}>
                  <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">Term of Confidentiality</div>
                  {confType === "years" ? (
                    <div>
                      <span className="text-[#209dd7]">☑</span>{" "}
                      {years} year(s) from Effective Date.
                      <br />
                      <span className="text-gray-400">☐</span>{" "}
                      <span className="text-gray-400">In perpetuity.</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-gray-400">☐</span>{" "}
                      <span className="text-gray-400">[N] year(s) from Effective Date.</span>
                      <br />
                      <span className="text-[#209dd7]">☑</span> In perpetuity.
                    </div>
                  )}
                </div>
              );
            }
            if (fieldDef.key === "term_of_confidentiality_years") return null; // rendered above

            return (
              <FieldRow
                key={fieldDef.key}
                label={fieldDef.label}
                value={value}
                fallback={`${fieldDef.label} not yet entered`}
              />
            );
          })}

          {/* Common fields */}
          <FieldRow label="Effective Date" value={formatDate(data.effective_date)} fallback="[Effective Date]" />

          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Governing Law" value={data.governing_law} fallback="State not entered" />
            <FieldRow label={jurisdictionLabel} value={data.jurisdiction} fallback="Not entered" />
          </div>
        </div>

        {/* Signature table */}
        <p className="mt-3 text-xs">
          By signing this Cover Page, each party agrees to enter into this agreement as of the Effective Date.
        </p>
        <table className="w-full mt-2 text-xs border-collapse">
          <thead>
            <tr className="bg-[#032147] text-white">
              <th className="border border-gray-300 p-2 text-left w-24"></th>
              <th className="border border-gray-300 p-2 text-center">{docDef.party1Label.toUpperCase()}</th>
              <th className="border border-gray-300 p-2 text-center">{docDef.party2Label.toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {(["company", "name", "title", "address"] as const).map((field) => (
              <tr key={field}>
                <td className="border border-gray-300 p-2 font-semibold bg-gray-50">
                  {field === "address" ? "Notice Address" :
                   field === "name" ? "Print Name" :
                   field.charAt(0).toUpperCase() + field.slice(1)}
                </td>
                <td className="border border-gray-300 p-2">{data.party1[field] || "—"}</td>
                <td className="border border-gray-300 p-2">{data.party2[field] || "—"}</td>
              </tr>
            ))}
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Signature</td>
              <td className="border border-gray-300 p-2 h-8"></td>
              <td className="border border-gray-300 p-2 h-8"></td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Date</td>
              <td className="border border-gray-300 p-2 h-8"></td>
              <td className="border border-gray-300 p-2 h-8"></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Standard Terms section indicator */}
      <div className="relative">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-1 mb-2">
          <h2 className="text-sm font-bold text-[#032147]">Standard Terms</h2>
          <button
            onClick={() => handleExplain("Standard Terms")}
            className="text-[#209dd7] hover:text-[#1a85b8] text-xs leading-none font-sans not-italic"
            title="Explain this section"
          >
            ⓘ
          </button>
        </div>
        {tooltip?.sectionId === "Standard Terms" && (
          <ClauseTooltip state={tooltip} onClose={() => setTooltip(null)} />
        )}
      </div>

      <p className="text-[10px] text-[#888888] italic">
        The full standard terms are included in the downloaded PDF.
      </p>

      <p className="text-[10px] text-[#888888] border-t border-gray-200 pt-2">
        Common Paper {docDef.displayName} · Free to use under CC BY 4.0
      </p>
    </div>
  );
}
