"use client";

import { NdaFormData } from "@/types/nda";

function formatDate(iso: string): string {
  if (!iso) return "[Effective Date]";
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function placeholder(value: string, fallback: string): React.ReactNode {
  return value.trim() ? (
    <strong className="text-[#032147]">{value}</strong>
  ) : (
    <span className="bg-yellow-100 text-yellow-800 rounded px-1 text-xs italic">
      {fallback}
    </span>
  );
}


interface NdaPreviewProps {
  data: NdaFormData;
}

export function NdaPreview({ data }: NdaPreviewProps) {
  const mndaTermLabel =
    data.mnda_term.type === "expires"
      ? `${data.mnda_term.years} year(s) from Effective Date`
      : "continues until terminated";

  const confidentialityLabel =
    data.term_of_confidentiality.type === "years"
      ? `${data.term_of_confidentiality.years} year(s) from Effective Date`
      : "in perpetuity";

  return (
    <div className="font-serif text-[13px] text-gray-800 leading-relaxed space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#032147] mb-1">
          Mutual Non-Disclosure Agreement
        </h1>
        <p className="text-xs text-[#888888]">
          This MNDA consists of this Cover Page and the Common Paper Mutual NDA Standard Terms
          Version 1.0. Modifications to Standard Terms should be made on the Cover Page.
        </p>
      </div>

      {/* Cover Page */}
      <section>
        <h2 className="text-base font-bold text-[#032147] border-b-2 border-[#209dd7] pb-1 mb-3">
          Cover Page
        </h2>

        <div className="space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">
              Purpose — How Confidential Information may be used
            </div>
            <div>{placeholder(data.purpose, "Purpose not yet entered")}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">
              Effective Date
            </div>
            <div>{formatDate(data.effective_date)}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">
              MNDA Term
            </div>
            {data.mnda_term.type === "expires" ? (
              <div>
                <span className="text-[#209dd7]">☑</span>{" "}
                Expires {data.mnda_term.years} year(s) from Effective Date.
                <br />
                <span className="text-gray-400">☐</span>{" "}
                <span className="text-gray-400">
                  Continues until terminated in accordance with MNDA terms.
                </span>
              </div>
            ) : (
              <div>
                <span className="text-gray-400">☐</span>{" "}
                <span className="text-gray-400">Expires [N] year(s) from Effective Date.</span>
                <br />
                <span className="text-[#209dd7]">☑</span>{" "}
                Continues until terminated in accordance with MNDA terms.
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">
              Term of Confidentiality
            </div>
            {data.term_of_confidentiality.type === "years" ? (
              <div>
                <span className="text-[#209dd7]">☑</span>{" "}
                {data.term_of_confidentiality.years} year(s) from Effective Date, but in the
                case of trade secrets until no longer a trade secret under applicable laws.
                <br />
                <span className="text-gray-400">☐</span>{" "}
                <span className="text-gray-400">In perpetuity.</span>
              </div>
            ) : (
              <div>
                <span className="text-gray-400">☐</span>{" "}
                <span className="text-gray-400">
                  [N] year(s) from Effective Date, but in the case of trade secrets until no
                  longer a trade secret under applicable laws.
                </span>
                <br />
                <span className="text-[#209dd7]">☑</span> In perpetuity.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">
                Governing Law
              </div>
              <div>{placeholder(data.governing_law, "State not entered")}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">
                Jurisdiction
              </div>
              <div>{placeholder(data.jurisdiction, "Jurisdiction not entered")}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#888888] mb-0.5">
              MNDA Modifications
            </div>
            <div>
              {data.modifications.trim()
                ? data.modifications
                : <span className="text-[#888888] italic">None</span>}
            </div>
          </div>
        </div>

        {/* Signature table */}
        <p className="mt-3 text-xs">
          By signing this Cover Page, each party agrees to enter into this MNDA as of the
          Effective Date.
        </p>
        <table className="w-full mt-2 text-xs border-collapse">
          <thead>
            <tr className="bg-[#032147] text-white">
              <th className="border border-gray-300 p-2 text-left w-24"></th>
              <th className="border border-gray-300 p-2 text-center">PARTY 1</th>
              <th className="border border-gray-300 p-2 text-center">PARTY 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Company</td>
              <td className="border border-gray-300 p-2">{data.party1.company || "—"}</td>
              <td className="border border-gray-300 p-2">{data.party2.company || "—"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Print Name</td>
              <td className="border border-gray-300 p-2">{data.party1.name || "—"}</td>
              <td className="border border-gray-300 p-2">{data.party2.name || "—"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Title</td>
              <td className="border border-gray-300 p-2">{data.party1.title || "—"}</td>
              <td className="border border-gray-300 p-2">{data.party2.title || "—"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">
                Notice Address
              </td>
              <td className="border border-gray-300 p-2">{data.party1.address || "—"}</td>
              <td className="border border-gray-300 p-2">{data.party2.address || "—"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Signature</td>
              <td className="border border-gray-300 p-2 h-8"></td>
              <td className="border border-gray-300 p-2 h-8"></td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Date</td>
              <td className="border border-gray-300 p-2 h-8"></td>
              <td className="border border-gray-300 p-2 h-8"></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Standard Terms */}
      <section>
        <h2 className="text-base font-bold text-[#032147] border-b-2 border-[#209dd7] pb-1 mb-3">
          Standard Terms
        </h2>
        <div className="space-y-3 text-[12px] text-gray-700 text-justify">
          <p>
            <strong>1. Introduction.</strong> This MNDA allows each party ("Disclosing Party")
            to disclose or make available information in connection with the{" "}
            {placeholder(data.purpose, "Purpose")} which (1) the Disclosing Party identifies to
            the receiving party ("Receiving Party") as "confidential", "proprietary", or the like
            or (2) should be reasonably understood as confidential or proprietary due to its nature
            and the circumstances of its disclosure ("Confidential Information").
          </p>
          <p>
            <strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party
            shall: (a) use Confidential Information solely for the{" "}
            {placeholder(data.purpose, "Purpose")}; (b) not disclose Confidential Information to
            third parties without prior written approval, except to representatives with a
            reasonable need to know for the {placeholder(data.purpose, "Purpose")}; and (c) protect
            Confidential Information using no less than a reasonable standard of care.
          </p>
          <p>
            <strong>3. Exceptions.</strong> The Receiving Party's obligations do not apply to
            information that: (a) is or becomes publicly available through no fault of the Receiving
            Party; (b) it rightfully knew prior to receipt without confidentiality restrictions;
            (c) it rightfully obtained from a third party without restrictions; or (d) it
            independently developed without using the Confidential Information.
          </p>
          <p>
            <strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose
            Confidential Information to the extent required by law or court order, provided it gives
            reasonable advance notice and cooperates with efforts to obtain confidential treatment.
          </p>
          <p>
            <strong>5. Term and Termination.</strong> This MNDA commences on the{" "}
            <strong className="text-[#032147]">{formatDate(data.effective_date)}</strong> and
            expires at the end of the{" "}
            <strong className="text-[#032147]">{mndaTermLabel}</strong>. The Receiving Party's
            obligations relating to Confidential Information will survive for{" "}
            <strong className="text-[#032147]">{confidentialityLabel}</strong>, despite any
            expiration or termination.
          </p>
          <p>
            <strong>6. Return or Destruction.</strong> Upon expiration or termination, the Receiving
            Party will cease using and destroy or return all Confidential Information, unless
            retained per standard backup or record retention policies or as required by law.
          </p>
          <p>
            <strong>7. Proprietary Rights.</strong> The Disclosing Party retains all intellectual
            property rights in its Confidential Information. Disclosure grants no license.
          </p>
          <p>
            <strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS",
            WITHOUT WARRANTIES, INCLUDING IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS
            FOR A PARTICULAR PURPOSE.
          </p>
          <p>
            <strong>9. Governing Law and Jurisdiction.</strong> This MNDA is governed by the laws
            of the State of {placeholder(data.governing_law, "Governing Law")}, without regard to
            conflict of laws provisions. Legal proceedings must be instituted in the federal or
            state courts located in{" "}
            {placeholder(data.jurisdiction, "Jurisdiction")}.
          </p>
          <p>
            <strong>10. Equitable Relief.</strong> A breach of this MNDA may cause irreparable
            harm. Upon breach, the Disclosing Party is entitled to seek equitable relief, including
            an injunction, in addition to other remedies.
          </p>
          <p>
            <strong>11. General.</strong> Neither party is obligated to disclose Confidential
            Information or proceed with any transaction. Assignment requires prior written consent,
            except in connection with a merger or acquisition. This MNDA constitutes the entire
            agreement of the parties with respect to its subject matter and may only be amended in
            writing signed by both parties.
          </p>
        </div>
        <p className="mt-4 text-[10px] text-[#888888] border-t border-gray-200 pt-2">
          Common Paper Mutual Non-Disclosure Agreement Version 1.0 · Free to use under CC BY 4.0
        </p>
      </section>
    </div>
  );
}
