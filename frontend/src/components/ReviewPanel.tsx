"use client";

import { useEffect, useRef, useState } from "react";

import { DocumentFormData } from "@/types/document";
import { DocumentTypeDef } from "@/lib/document-registry";
import { DocumentReviewResponse, ReviewRisk, reviewDocument } from "@/lib/review";

interface ReviewPanelProps {
  data: DocumentFormData;
  docDef: DocumentTypeDef;
}

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    score >= 80 ? "text-green-700" : score >= 50 ? "text-amber-700" : "text-red-700";

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-[#032147]">Completeness</span>
        <span className={`text-sm font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function RiskItem({ risk }: { risk: ReviewRisk }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs mb-2 ${SEVERITY_STYLES[risk.severity] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      <span className="font-semibold uppercase mr-1">{risk.severity}:</span>
      <span className="font-medium">{risk.field}</span> — {risk.message}
    </div>
  );
}

export function ReviewPanel({ data, docDef }: ReviewPanelProps) {
  const [result, setResult] = useState<DocumentReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const reviewedDataRef = useRef<DocumentFormData | null>(null);

  useEffect(() => {
    if (reviewedDataRef.current && result) {
      if (JSON.stringify(data) !== JSON.stringify(reviewedDataRef.current)) {
        setStale(true);
      }
    }
  }, [data, result]);

  const handleReview = async () => {
    setLoading(true);
    setError(null);
    setStale(false);
    try {
      const fields = {
        effective_date: data.effective_date || null,
        governing_law: data.governing_law || null,
        jurisdiction: data.jurisdiction || null,
        party1: data.party1,
        party2: data.party2,
        extra_fields: data.extra_fields,
      };
      const res = await reviewDocument(docDef.slug, fields);
      setResult(res);
      reviewedDataRef.current = data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {stale && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Document has changed since last review. Run again to refresh.
        </div>
      )}

      {!result && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-gray-500">
            AI will analyze your document for completeness and flag potential risks.
          </p>
          <button
            onClick={handleReview}
            className="bg-[#753991] hover:bg-[#5e2d73] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Review Document
          </button>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-500">
          <div className="w-6 h-6 border-2 border-[#753991] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Analyzing your document…</p>
        </div>
      )}

      {error && (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <ScoreBar score={result.completeness_score} />

          {result.risks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#032147] uppercase tracking-wide mb-2">
                Risks
              </h4>
              {result.risks.map((risk, i) => (
                <RiskItem key={i} risk={risk} />
              ))}
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#032147] uppercase tracking-wide mb-2">
                Suggestions
              </h4>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-[#209dd7] shrink-0">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleReview}
            className="w-full mt-4 border border-[#753991] text-[#753991] hover:bg-[#753991] hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Re-run Review
          </button>
        </div>
      )}
    </div>
  );
}
