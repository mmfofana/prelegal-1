"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ChatPanel } from "@/components/ChatPanel";
import { DocumentForm } from "@/components/DocumentForm";
import { DocumentPreview } from "@/components/DocumentPreview";
import { DownloadButton } from "@/components/DownloadButton";
import { CATALOG_ORDER, DOCUMENT_REGISTRY } from "@/lib/document-registry";
import { useAuth, signout } from "@/lib/auth";
import { DocumentFormData, DOCUMENT_DEFAULTS, defaultDocumentFormData } from "@/types/document";

type ActiveTab = "chat" | "form";

export function DocumentEditor({ slug }: { slug: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const docDef = DOCUMENT_REGISTRY[slug];

  const [formData, setFormData] = useState<DocumentFormData>(() =>
    defaultDocumentFormData(slug, DOCUMENT_DEFAULTS[slug] ?? {}),
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Reset form when slug changes (user switches document type)
  useEffect(() => {
    setFormData(defaultDocumentFormData(slug, DOCUMENT_DEFAULTS[slug] ?? {}));
    setActiveTab("chat");
  }, [slug]);

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

  async function handleSignout() {
    await signout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#032147] text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="text-[#ecad0a]">Pre</span>legal
            </button>
            {/* Document type dropdown */}
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
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user.email}</span>
            <button
              onClick={handleSignout}
              className="text-sm text-gray-300 hover:text-white underline"
            >
              Sign out
            </button>
            <DownloadButton data={formData} docDef={docDef} />
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto flex gap-0 h-[calc(100vh-72px)]">
        {/* Left — Chat or Form */}
        <aside className="w-[420px] min-w-[340px] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Tab toggle */}
          <div className="flex border-b border-gray-200 shrink-0">
            {(["chat", "form"] as const).map((tab) => (
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
