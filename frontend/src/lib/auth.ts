"use client";

import { useEffect, useState } from "react";

export interface User {
  id: number;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<User>;
      })
      .then((user) => setState({ user, loading: false }))
      .catch(() => setState({ user: null, loading: false }));
  }, []);

  return state;
}

export async function signup(email: string, password: string): Promise<User> {
  const r = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? "Signup failed");
  }
  return r.json();
}

export async function signin(email: string, password: string): Promise<User> {
  const r = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? "Sign in failed");
  }
  return r.json();
}

export async function signout(): Promise<void> {
  await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
}
