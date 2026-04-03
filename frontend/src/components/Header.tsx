"use client";

import { useRouter } from "next/navigation";

import { User, signout } from "@/lib/auth";

interface HeaderProps {
  user: User;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function Header({ user, centerSlot, rightSlot }: HeaderProps) {
  const router = useRouter();

  async function handleSignout() {
    await signout();
    router.push("/login");
  }

  return (
    <header className="bg-[#032147] text-white px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="text-[#ecad0a]">Pre</span>legal
          </button>
          {centerSlot}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/history")}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            My Documents
          </button>
          <span className="text-sm text-gray-300 hidden sm:inline">{user.email}</span>
          <button
            onClick={handleSignout}
            className="text-sm text-gray-300 hover:text-white underline"
          >
            Sign out
          </button>
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
