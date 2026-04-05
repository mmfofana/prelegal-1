"use client";

import { useEffect, useState } from "react";

import { DocumentFormData, Party } from "@/types/document";
import { DocumentTypeDef, FieldDef } from "@/lib/document-registry";
import { SavedPartyProfile, listParties } from "@/lib/parties";
import { PartyLoader } from "@/components/PartyLoader";

interface DocumentFormProps {
  data: DocumentFormData;
  docDef: DocumentTypeDef;
  onChange: (data: DocumentFormData) => void;
}

function PartyFields({
  label,
  party,
  onChange,
}: {
  label: string;
  party: Party;
  onChange: (party: Party) => void;
}) {
  const update = (field: keyof Party, value: string) =>
    onChange({ ...party, [field]: value });

  return (
    <fieldset className="border border-gray-200 rounded-lg p-4 mb-4">
      <legend className="px-2 font-semibold text-[#032147]">{label}</legend>
      <div className="space-y-3">
        {(["company", "name", "title", "address"] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-[#888888] mb-1">
              {field === "address"
                ? "Notice Address (email or postal)"
                : field === "name"
                ? "Representative Name"
                : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type="text"
              value={party[field]}
              onChange={(e) => update(field, e.target.value)}
              placeholder={
                field === "company" ? "Acme Corp." :
                field === "name" ? "Jane Smith" :
                field === "title" ? "CEO" : "jane@acme.com"
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7] placeholder:text-gray-500"
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function ExtraField({
  fieldDef,
  value,
  onChange,
}: {
  fieldDef: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7] placeholder:text-gray-500";

  const isNdaTermType = fieldDef.key === "mnda_term_type";
  const isNdaConfidType = fieldDef.key === "term_of_confidentiality_type";

  if (isNdaTermType || isNdaConfidType) {
    // Special rendering for NDA radio-style selects
    return (
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          {fieldDef.label}
          {fieldDef.required === false && (
            <span className="text-[#888888] font-normal"> (optional)</span>
          )}
        </label>
        {fieldDef.description && (
          <p className="text-xs text-[#888888] mb-2">{fieldDef.description}</p>
        )}
        <div className="space-y-1">
          {fieldDef.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={fieldDef.key}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="accent-[#209dd7]"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (fieldDef.type === "select") {
    return (
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          {fieldDef.label}
          {fieldDef.required === false && (
            <span className="text-[#888888] font-normal"> (optional)</span>
          )}
        </label>
        {fieldDef.description && (
          <p className="text-xs text-[#888888] mb-1">{fieldDef.description}</p>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          {!value && <option value="">Select…</option>}
          {fieldDef.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (fieldDef.type === "textarea") {
    return (
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          {fieldDef.label}
          {fieldDef.required === false && (
            <span className="text-[#888888] font-normal"> (optional)</span>
          )}
        </label>
        {fieldDef.description && (
          <p className="text-xs text-[#888888] mb-1">{fieldDef.description}</p>
        )}
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fieldDef.placeholder}
          className={inputClass}
        />
      </div>
    );
  }

  if (fieldDef.type === "integer") {
    return (
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          {fieldDef.label}
          {fieldDef.required === false && (
            <span className="text-[#888888] font-normal"> (optional)</span>
          )}
        </label>
        {fieldDef.description && (
          <p className="text-xs text-[#888888] mb-1">{fieldDef.description}</p>
        )}
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fieldDef.placeholder}
          className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
        />
      </div>
    );
  }

  // Default: text or date
  return (
    <div>
      <label className="block text-sm font-semibold text-[#032147] mb-1">
        {fieldDef.label}
        {fieldDef.required === false && (
          <span className="text-[#888888] font-normal"> (optional)</span>
        )}
      </label>
      {fieldDef.description && (
        <p className="text-xs text-[#888888] mb-1">{fieldDef.description}</p>
      )}
      <input
        type={fieldDef.type === "date" ? "date" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={fieldDef.placeholder}
        className={inputClass}
      />
    </div>
  );
}

export function DocumentForm({ data, docDef, onChange }: DocumentFormProps) {
  const [profiles, setProfiles] = useState<SavedPartyProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  useEffect(() => {
    listParties()
      .then(setProfiles)
      .catch(() => {/* silently ignore - user may not be signed in */})
      .finally(() => setProfilesLoading(false));
  }, []);

  const updateCommon = <K extends keyof DocumentFormData>(
    field: K,
    value: DocumentFormData[K],
  ) => onChange({ ...data, [field]: value });

  const updateExtra = (key: string, value: string) =>
    onChange({ ...data, extra_fields: { ...data.extra_fields, [key]: value } });

  const jurisdictionLabel = docDef.jurisdictionLabel ?? "Jurisdiction";

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {/* Document-specific extra fields (shown first, most relevant) */}
      {docDef.extraFields.map((fieldDef) => {
        // Skip the mnda_term_years field if term type is "continues"
        if (
          fieldDef.key === "mnda_term_years" &&
          data.extra_fields["mnda_term_type"] === "continues"
        ) {
          return null;
        }
        // Skip term_of_confidentiality_years if type is "perpetuity"
        if (
          fieldDef.key === "term_of_confidentiality_years" &&
          data.extra_fields["term_of_confidentiality_type"] === "perpetuity"
        ) {
          return null;
        }
        return (
          <ExtraField
            key={fieldDef.key}
            fieldDef={fieldDef}
            value={data.extra_fields[fieldDef.key] ?? ""}
            onChange={(v) => updateExtra(fieldDef.key, v)}
          />
        );
      })}

      {/* Common fields */}
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          Effective Date
        </label>
        <input
          type="date"
          value={data.effective_date}
          onChange={(e) => updateCommon("effective_date", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          Governing Law
        </label>
        <input
          type="text"
          value={data.governing_law}
          onChange={(e) => updateCommon("governing_law", e.target.value)}
          placeholder="e.g. Delaware"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7] placeholder:text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          {jurisdictionLabel}
        </label>
        <input
          type="text"
          value={data.jurisdiction}
          onChange={(e) => updateCommon("jurisdiction", e.target.value)}
          placeholder={
            jurisdictionLabel === "Chosen Courts"
              ? "e.g. courts of Delaware"
              : "e.g. courts located in New Castle, DE"
          }
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7] placeholder:text-gray-500"
        />
      </div>

      {/* Parties */}
      <div>
        <h3 className="text-sm font-semibold text-[#032147] mb-3">Parties</h3>
        <PartyLoader
          profiles={profiles}
          profilesLoading={profilesLoading}
          currentParty={data.party1}
          onLoad={(party) => updateCommon("party1", party)}
          onSaved={(profile) => setProfiles((prev) => [...prev, profile])}
        />
        <PartyFields
          label={docDef.party1Label}
          party={data.party1}
          onChange={(party) => updateCommon("party1", party)}
        />
        <PartyLoader
          profiles={profiles}
          profilesLoading={profilesLoading}
          currentParty={data.party2}
          onLoad={(party) => updateCommon("party2", party)}
          onSaved={(profile) => setProfiles((prev) => [...prev, profile])}
        />
        <PartyFields
          label={docDef.party2Label}
          party={data.party2}
          onChange={(party) => updateCommon("party2", party)}
        />
      </div>
    </form>
  );
}
