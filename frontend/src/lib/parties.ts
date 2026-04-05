export interface SavedPartyProfile {
  id: number;
  label: string;
  company: string;
  name: string;
  title: string;
  address: string;
  created_at: string;
}

export async function listParties(): Promise<SavedPartyProfile[]> {
  const res = await fetch("/api/parties", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load party profiles");
  return res.json() as Promise<SavedPartyProfile[]>;
}

export async function createParty(
  data: Omit<SavedPartyProfile, "id" | "created_at">,
): Promise<SavedPartyProfile> {
  const res = await fetch("/api/parties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to save party profile");
  }
  return res.json() as Promise<SavedPartyProfile>;
}

export async function deleteParty(id: number): Promise<void> {
  const res = await fetch(`/api/parties/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete party profile");
}
