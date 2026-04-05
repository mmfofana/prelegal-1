"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { DocumentVersionSummary, DocumentVersionDetail, listVersions, getVersion } from "@/lib/versions";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface VersionsPageProps {
  docId: number;
}

export function VersionsPage({ docId }: VersionsPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [versions, setVersions] = useState<DocumentVersionSummary[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    listVersions(docId)
      .then(setVersions)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setFetching(false));
  }, [loading, user, docId]);

  if (loading || !user) return null;

  const handleRestore = async (version: DocumentVersionSummary) => {
    setRestoring(version.version_number);
    try {
      const detail: DocumentVersionDetail = await getVersion(docId, version.version_number);
      sessionStorage.setItem("restore_fields", JSON.stringify(detail.fields));
      router.push(`/document/${detail.fields.document_type}`);
    } catch {
      setRestoring(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#032147] text-white px-6 py-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push("/history")} className="text-gray-300 hover:text-white text-sm">
            ← My Documents
          </button>
          <span className="text-white font-semibold">Version History</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-16" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium text-[#032147] mb-2">No versions yet</p>
            <p className="text-sm">Versions are saved automatically each time you download a PDF.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-[#032147] text-sm">Version {v.version_number}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(v.created_at)}</p>
                </div>
                <button
                  onClick={() => handleRestore(v)}
                  disabled={restoring === v.version_number}
                  className="text-sm text-[#209dd7] hover:text-[#1a85b8] font-medium disabled:opacity-50"
                >
                  {restoring === v.version_number ? "Loading…" : "Restore this version"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
