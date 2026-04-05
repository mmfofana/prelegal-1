"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/Header";
import { SigningModal } from "@/components/SigningModal";
import { DOCUMENT_REGISTRY } from "@/lib/document-registry";
import { useAuth } from "@/lib/auth";
import { listDocuments, deleteDocument, SavedDocumentSummary } from "@/lib/documents";
import { createShareLink } from "@/lib/share";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-6" />
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded-lg w-24" />
        <div className="h-8 bg-gray-200 rounded-lg w-16" />
      </div>
    </div>
  );
}

interface DocumentCardProps {
  doc: SavedDocumentSummary;
  onDelete: (id: number) => void;
  onDeleteError: (msg: string) => void;
}

function DocumentCard({ doc, onDelete, onDeleteError }: DocumentCardProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [signingSuccess, setSigningSuccess] = useState(false);

  const docDef = DOCUMENT_REGISTRY[doc.document_type];
  const displayName = docDef?.displayName ?? doc.document_type;

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteDocument(doc.id);
      onDelete(doc.id);
    } catch (err: unknown) {
      setDeleting(false);
      setConfirmDelete(false);
      onDeleteError(err instanceof Error ? err.message : "Failed to delete document");
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const { url } = await createShareLink(doc.id);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onDeleteError("Failed to create share link");
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      {showSigningModal && (
        <SigningModal
          docId={doc.id}
          docTitle={doc.title}
          onClose={() => setShowSigningModal(false)}
          onSuccess={() => { setShowSigningModal(false); setSigningSuccess(true); }}
        />
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
        <div>
          <span className="inline-block text-xs bg-[#209dd7]/10 text-[#209dd7] font-medium rounded-full px-2.5 py-0.5 mb-2">
            {displayName}
          </span>
          <h3 className="font-semibold text-[#032147] leading-snug mb-1">{doc.title}</h3>
          <p className="text-xs text-gray-400">Saved {formatDate(doc.created_at)}</p>
          {signingSuccess && (
            <p className="text-xs text-green-600 mt-1">Signing invites sent ✓</p>
          )}
          {copied && (
            <p className="text-xs text-[#209dd7] mt-1">Link copied to clipboard ✓</p>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => router.push(`/document/${doc.document_type}?from=${doc.id}`)}
            className="w-full bg-[#209dd7] hover:bg-[#1a85b8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Continue editing
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/history/${doc.id}/versions`)}
              className="flex-1 border border-gray-200 text-gray-500 hover:text-[#032147] hover:border-gray-300 text-xs px-2 py-1.5 rounded-lg transition-colors"
            >
              Versions
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 border border-gray-200 text-gray-500 hover:text-[#209dd7] hover:border-[#209dd7] text-xs px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {sharing ? "…" : "Share"}
            </button>
            <button
              onClick={() => setShowSigningModal(true)}
              className="flex-1 border border-gray-200 text-gray-500 hover:text-[#753991] hover:border-[#753991] text-xs px-2 py-1.5 rounded-lg transition-colors"
            >
              Sign
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              onBlur={() => setConfirmDelete(false)}
              className={`text-xs px-2 py-1.5 rounded-lg transition-colors ${
                confirmDelete
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              } disabled:opacity-50`}
            >
              {confirmDelete ? "Confirm?" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<SavedDocumentSummary[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    listDocuments()
      .then((data) => setDocs(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setFetching(false));
  }, [loading, user]);

  if (loading || !user) return null;

  function handleDelete(id: number) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        rightSlot={
          <button
            onClick={() => router.push("/")}
            className="bg-[#753991] hover:bg-[#5e2d73] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            New document
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#032147] mb-1">My Documents</h2>
          <p className="text-sm text-gray-500">
            Documents are saved automatically when you download a PDF.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {fetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-2xl">
              📄
            </div>
            <h3 className="text-lg font-semibold text-[#032147] mb-2">No documents yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              Download a PDF from any document editor and it will be saved here automatically.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#753991] hover:bg-[#5e2d73] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Browse templates
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} onDeleteError={setError} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
