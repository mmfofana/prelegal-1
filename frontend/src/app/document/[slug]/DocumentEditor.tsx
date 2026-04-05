"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChatPanel } from "@/components/ChatPanel";
import { DocumentForm } from "@/components/DocumentForm";
import { DocumentPreview } from "@/components/DocumentPreview";
import { DownloadButton } from "@/components/DownloadButton";
import { DownloadDocxButton } from "@/components/DownloadDocxButton";
import { Header } from "@/components/Header";
import { ReviewPanel } from "@/components/ReviewPanel";
import { CATALOG_ORDER, DOCUMENT_REGISTRY } from "@/lib/document-registry";
import { useAuth } from "@/lib/auth";
import { fetchDocument } from "@/lib/documents";
import { DocumentFormData, DOCUMENT_DEFAULTS, defaultDocumentFormData } from "@/types/document";

type ActiveTab = "chat" | "form" | "review";

export function DocumentEditor({ slug }: { slug: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const docDef = DOCUMENT_REGISTRY[slug];

  const [formData, setFormData] = useState<DocumentFormData>(() =>
    defaultDocumentFormData(slug, DOCUMENT_DEFAULTS[slug] ?? {}),
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const hydrated = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Reset form when slug changes (user switches document type)
  useEffect(() => {
    setFormData(defaultDocumentFormData(slug, DOCUMENT_DEFAULTS[slug] ?? {}));
    setActiveTab("chat");
    hydrated.current = false;
  }, [slug]);

  // Load saved document from ?from= query param (once on mount per slug)
  useEffect(() => {
    if (hydrated.current || authLoading || !user) return;
    const fromId = searchParams.get("from");
    if (!fromId) return;
    hydrated.current = true;
    fetchDocument(Number(fromId))
      .then((doc) => {
        setFormData(doc.fields);
        // Clear the ?from= param so refreshing doesn't re-hydrate over edits
        router.replace(`/document/${slug}`);
      })
      .catch(() => {
        router.replace(`/document/${slug}`);
      });
  }, [authLoading, user, searchParams, slug, router]);

  if (authLoading || !user) return null;

  if (!docDef) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#032147] mb-2">Document Not Found</h1>
          <p className="text-gray-500 mb-4">We don&apos;t have a template for &ldquo;{slug}&rdquo;.</p>
          <button
            onClick={() => router.push("/")}
            className="text-[#209dd7] underline"
          >
            Browse available documents
          </button>
        </div>
      </div>
    );
  }

  const docTypeDropdown = (
    <select
      value={slug}
      onChange={(e) => router.push(`/document/${e.target.value}`)}
      className="bg-white/10 border border-white/20 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#209dd7] hover:bg-white/20 transition-colors"
    >
      {CATALOG_ORDER.filter((s) => s !== "mutual-nda-coverpage").map((s) => {
        const def = DOCUMENT_REGISTRY[s];
        return (
          <option key={s} value={s} className="bg-[#032147] text-white">
            {def.displayName}
          </option>
        );
      })}
    </select>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        centerSlot={docTypeDropdown}
        rightSlot={
          <div className="flex gap-2">
            <DownloadDocxButton data={formData} docDef={docDef} />
            <DownloadButton data={formData} docDef={docDef} />
          </div>
        }
      />

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto flex gap-0 h-[calc(100vh-72px)]">
        {/* Left — Chat or Form */}
        <aside className="w-[420px] min-w-[340px] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Tab toggle */}
          <div className="flex border-b border-gray-200 shrink-0">
            {(["chat", "form", "review"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-[#032147] border-b-2 border-[#209dd7]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Panel content */}
          {activeTab === "chat" ? (
            <div className="flex-1 min-h-0 flex flex-col p-6">
              <ChatPanel data={formData} docDef={docDef} onChange={setFormData} />
            </div>
          ) : activeTab === "review" ? (
            <div className="flex-1 overflow-y-auto p-6">
              <ReviewPanel data={formData} docDef={docDef} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <DocumentForm data={formData} docDef={docDef} onChange={setFormData} />
            </div>
          )}
        </aside>

        {/* Right — Live Preview */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-lg p-8 border border-gray-100">
            <DocumentPreview data={formData} docDef={docDef} />
          </div>
        </main>
      </div>
    </div>
  );
}
