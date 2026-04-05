"use client";

import { useState } from "react";

import { Party } from "@/types/document";
import { SavedPartyProfile, createParty } from "@/lib/parties";

interface PartyLoaderProps {
  profiles: SavedPartyProfile[];
  profilesLoading: boolean;
  currentParty: Party;
  onLoad: (party: Party) => void;
  onSaved: (profile: SavedPartyProfile) => void;
}

export function PartyLoader({
  profiles,
  profilesLoading,
  currentParty,
  onLoad,
  onSaved,
}: PartyLoaderProps) {
  const [saving, setSaving] = useState(false);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [label, setLabel] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleLoad = (id: string) => {
    if (!id) return;
    const profile = profiles.find((p) => String(p.id) === id);
    if (profile) {
      onLoad({ company: profile.company, name: profile.name, title: profile.title, address: profile.address });
    }
  };

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const profile = await createParty({
        label: label.trim(),
        company: currentParty.company,
        name: currentParty.name,
        title: currentParty.title,
        address: currentParty.address,
      });
      onSaved(profile);
      setShowLabelInput(false);
      setLabel("");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3 space-y-2">
      {profiles.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => handleLoad(e.target.value)}
            defaultValue=""
            disabled={profilesLoading}
            className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
          >
            <option value="">Load saved party…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!showLabelInput ? (
        <button
          type="button"
          onClick={() => setShowLabelInput(true)}
          className="text-xs text-[#209dd7] hover:underline"
        >
          + Save as profile
        </button>
      ) : (
        <div className="flex gap-1 items-center">
          <input
            autoFocus
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setShowLabelInput(false); }}
            placeholder="Profile name…"
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !label.trim()}
            className="text-xs bg-[#209dd7] text-white px-2 py-1 rounded disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setShowLabelInput(false); setLabel(""); }}
            className="text-xs text-gray-400 px-1"
          >
            ✕
          </button>
        </div>
      )}

      {saveError && <p className="text-xs text-red-500">{saveError}</p>}
    </div>
  );
}
