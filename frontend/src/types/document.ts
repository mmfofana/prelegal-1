export interface Party {
  company: string;
  name: string;
  title: string;
  address: string;
}

export interface DocumentFormData {
  document_type: string;
  effective_date: string; // YYYY-MM-DD
  governing_law: string;
  jurisdiction: string;
  party1: Party;
  party2: Party;
  /** Document-specific fields as flat string values */
  extra_fields: Record<string, string>;
}

export function defaultParty(): Party {
  return { company: "", name: "", title: "", address: "" };
}

export function defaultDocumentFormData(documentType: string, extraDefaults: Record<string, string> = {}): DocumentFormData {
  return {
    document_type: documentType,
    effective_date: new Date().toISOString().split("T")[0],
    governing_law: "",
    jurisdiction: "",
    party1: defaultParty(),
    party2: defaultParty(),
    extra_fields: extraDefaults,
  };
}

/** Default extra_fields per document type */
export const DOCUMENT_DEFAULTS: Record<string, Record<string, string>> = {
  "mutual-nda": {
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    mnda_term_type: "expires",
    mnda_term_years: "1",
    term_of_confidentiality_type: "years",
    term_of_confidentiality_years: "1",
    modifications: "",
  },
  "mutual-nda-coverpage": {
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    mnda_term_type: "expires",
    mnda_term_years: "1",
    term_of_confidentiality_type: "years",
    term_of_confidentiality_years: "1",
    modifications: "",
  },
};
