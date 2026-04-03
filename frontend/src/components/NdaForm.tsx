"use client";

import { NdaFormData, NdaParty } from "@/types/nda";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

function PartyFields({
  label,
  party,
  onChange,
}: {
  label: string;
  party: NdaParty;
  onChange: (party: NdaParty) => void;
}) {
  const update = (field: keyof NdaParty, value: string) =>
    onChange({ ...party, [field]: value });

  return (
    <fieldset className="border border-gray-200 rounded-lg p-4 mb-4">
      <legend className="px-2 font-semibold text-[#032147]">{label}</legend>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[#888888] mb-1">
            Company
          </label>
          <input
            type="text"
            value={party.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Acme Corp."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#888888] mb-1">
            Representative Name
          </label>
          <input
            type="text"
            value={party.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jane Smith"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#888888] mb-1">
            Title
          </label>
          <input
            type="text"
            value={party.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="CEO"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#888888] mb-1">
            Notice Address (email or postal)
          </label>
          <input
            type="text"
            value={party.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="jane@acme.com"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
          />
        </div>
      </div>
    </fieldset>
  );
}

export function NdaForm({ data, onChange }: NdaFormProps) {
  const update = <K extends keyof NdaFormData>(field: K, value: NdaFormData[K]) =>
    onChange({ ...data, [field]: value });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {/* Purpose */}
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          Purpose
        </label>
        <p className="text-xs text-[#888888] mb-1">
          How Confidential Information may be used
        </p>
        <textarea
          rows={3}
          value={data.purpose}
          onChange={(e) => update("purpose", e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
        />
      </div>

      {/* Effective Date */}
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          Effective Date
        </label>
        <input
          type="date"
          value={data.effective_date}
          onChange={(e) => update("effective_date", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
        />
      </div>

      {/* MNDA Term */}
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          MNDA Term
        </label>
        <p className="text-xs text-[#888888] mb-2">The length of this MNDA</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mnda_term_type"
              value="expires"
              checked={data.mnda_term.type === "expires"}
              onChange={() =>
                update("mnda_term", { ...data.mnda_term, type: "expires" })
              }
              className="accent-[#209dd7]"
            />
            <span className="text-sm">Expires after</span>
            {data.mnda_term.type === "expires" && (
              <input
                type="number"
                min={1}
                value={data.mnda_term.years}
                onChange={(e) =>
                  update("mnda_term", {
                    ...data.mnda_term,
                    years: Number(e.target.value),
                  })
                }
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
              />
            )}
            {data.mnda_term.type === "expires" && (
              <span className="text-sm">year(s) from Effective Date</span>
            )}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mnda_term_type"
              value="continues"
              checked={data.mnda_term.type === "continues"}
              onChange={() =>
                update("mnda_term", { ...data.mnda_term, type: "continues" })
              }
              className="accent-[#209dd7]"
            />
            <span className="text-sm">
              Continues until terminated in accordance with MNDA terms
            </span>
          </label>
        </div>
      </div>

      {/* Term of Confidentiality */}
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          Term of Confidentiality
        </label>
        <p className="text-xs text-[#888888] mb-2">
          How long Confidential Information is protected
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="confidentiality_type"
              value="years"
              checked={data.term_of_confidentiality.type === "years"}
              onChange={() =>
                update("term_of_confidentiality", {
                  ...data.term_of_confidentiality,
                  type: "years",
                })
              }
              className="accent-[#209dd7]"
            />
            <span className="text-sm">Fixed:</span>
            {data.term_of_confidentiality.type === "years" && (
              <input
                type="number"
                min={1}
                value={data.term_of_confidentiality.years}
                onChange={(e) =>
                  update("term_of_confidentiality", {
                    ...data.term_of_confidentiality,
                    years: Number(e.target.value),
                  })
                }
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
              />
            )}
            {data.term_of_confidentiality.type === "years" && (
              <span className="text-sm">year(s) from Effective Date</span>
            )}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="confidentiality_type"
              value="perpetuity"
              checked={data.term_of_confidentiality.type === "perpetuity"}
              onChange={() =>
                update("term_of_confidentiality", {
                  ...data.term_of_confidentiality,
                  type: "perpetuity",
                })
              }
              className="accent-[#209dd7]"
            />
            <span className="text-sm">In perpetuity</span>
          </label>
        </div>
      </div>

      {/* Governing Law */}
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          Governing Law
        </label>
        <input
          type="text"
          value={data.governing_law}
          onChange={(e) => update("governing_law", e.target.value)}
          placeholder="e.g. Delaware"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
        />
      </div>

      {/* Jurisdiction */}
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          Jurisdiction
        </label>
        <input
          type="text"
          value={data.jurisdiction}
          onChange={(e) => update("jurisdiction", e.target.value)}
          placeholder="e.g. courts located in New Castle, DE"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
        />
      </div>

      {/* Modifications */}
      <div>
        <label className="block text-sm font-semibold text-[#032147] mb-1">
          MNDA Modifications <span className="text-[#888888] font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={data.modifications}
          onChange={(e) => update("modifications", e.target.value)}
          placeholder="List any modifications to the Standard Terms, or leave blank for none."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7]"
        />
      </div>

      {/* Parties */}
      <div>
        <h3 className="text-sm font-semibold text-[#032147] mb-3">Parties</h3>
        <PartyFields
          label="Party 1"
          party={data.party1}
          onChange={(party) => update("party1", party)}
        />
        <PartyFields
          label="Party 2"
          party={data.party2}
          onChange={(party) => update("party2", party)}
        />
      </div>
    </form>
  );
}
