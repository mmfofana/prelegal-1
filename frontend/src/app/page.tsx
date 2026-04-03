"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DownloadButton } from "@/components/DownloadButton";
import { NdaForm } from "@/components/NdaForm";
import { NdaPreview } from "@/components/NdaPreview";
import { NdaFormData, defaultNdaFormData } from "@/types/nda";
import { useAuth, signout } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<NdaFormData>(defaultNdaFormData());

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  async function handleSignout() {
    await signout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#032147] text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-[#ecad0a]">Pre</span>legal
            </h1>
            <p className="text-sm text-gray-300">Mutual NDA Creator</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user.email}</span>
            <button
              onClick={handleSignout}
              className="text-sm text-gray-300 hover:text-white underline"
            >
              Sign out
            </button>
            <DownloadButton data={formData} />
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto flex gap-0 h-[calc(100vh-72px)]">
        {/* Left — Form */}
        <aside className="w-[420px] min-w-[340px] bg-white border-r border-gray-200 overflow-y-auto p-6">
          <h2 className="text-[#032147] font-semibold text-lg mb-4">
            Fill in the details
          </h2>
          <NdaForm data={formData} onChange={setFormData} />
        </aside>

        {/* Right — Live Preview */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-lg p-8 border border-gray-100">
            <NdaPreview data={formData} />
          </div>
        </main>
      </div>
    </div>
  );
}
