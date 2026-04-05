"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/Header";
import { CATALOG_ORDER, DOCUMENT_REGISTRY } from "@/lib/document-registry";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-[#032147] mb-3">
            Choose a Legal Document
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Select a template to start drafting. Our AI will guide you through
            filling in the key terms via conversation, or you can use the form
            directly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATALOG_ORDER.map((slug) => {
            const def = DOCUMENT_REGISTRY[slug];
            const href = slug === "mutual-nda-coverpage" ? "/document/mutual-nda" : `/document/${slug}`;
            return (
              <button
                key={slug}
                onClick={() => router.push(href)}
                className="group text-left bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-[#209dd7] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-[#032147] group-hover:text-[#209dd7] transition-colors leading-tight">
                    {def.displayName}
                  </h3>
                  <span className="ml-2 shrink-0 text-[#209dd7] opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{def.description}</p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                    {def.party1Label}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                    {def.party2Label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          All templates from{" "}
          <a
            href="https://commonpaper.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            Common Paper
          </a>{" "}
          · Free to use under CC BY 4.0
        </p>
      </main>
    </div>
  );
}
