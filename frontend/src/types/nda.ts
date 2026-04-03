export interface NdaParty {
  company: string;
  name: string;
  title: string;
  address: string;
}

export type MndaTermType = "expires" | "continues";
export type ConfidentialityTermType = "years" | "perpetuity";

export interface MndaTerm {
  type: MndaTermType;
  years: number;
}

export interface TermOfConfidentiality {
  type: ConfidentialityTermType;
  years: number;
}

export interface NdaFormData {
  purpose: string;
  effective_date: string; // YYYY-MM-DD
  mnda_term: MndaTerm;
  term_of_confidentiality: TermOfConfidentiality;
  governing_law: string;
  jurisdiction: string;
  modifications: string;
  party1: NdaParty;
  party2: NdaParty;
}

export const defaultNdaFormData = (): NdaFormData => ({
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effective_date: new Date().toISOString().split("T")[0],
  mnda_term: { type: "expires", years: 1 },
  term_of_confidentiality: { type: "years", years: 1 },
  governing_law: "",
  jurisdiction: "",
  modifications: "",
  party1: { company: "", name: "", title: "", address: "" },
  party2: { company: "", name: "", title: "", address: "" },
});
