export type FieldType = "text" | "textarea" | "date" | "select" | "integer";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  description: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface DocumentTypeDef {
  slug: string;
  displayName: string;
  description: string;
  party1Label: string;
  party2Label: string;
  extraFields: FieldDef[];
  pdfFilename: string;
  jurisdictionLabel?: string;
}

const MUTUAL_NDA: DocumentTypeDef = {
  slug: "mutual-nda",
  displayName: "Mutual Non-Disclosure Agreement",
  description: "A standard mutual NDA for protecting confidential information exchanged between two parties.",
  party1Label: "Party 1",
  party2Label: "Party 2",
  pdfFilename: "mutual-nda.pdf",
  extraFields: [
    { key: "purpose", label: "Purpose", type: "textarea", description: "How Confidential Information may be used",
      placeholder: "Evaluating whether to enter into a business relationship with the other party." },
    { key: "mnda_term_type", label: "MNDA Term", type: "select", description: "How long the MNDA lasts",
      options: ["expires", "continues"] },
    { key: "mnda_term_years", label: "MNDA Term (Years)", type: "integer",
      description: "Number of years (if mnda_term_type is 'expires')", required: false, placeholder: "1" },
    { key: "term_of_confidentiality_type", label: "Term of Confidentiality", type: "select",
      description: "How long Confidential Information is protected", options: ["years", "perpetuity"] },
    { key: "term_of_confidentiality_years", label: "Confidentiality Term (Years)", type: "integer",
      description: "Number of years (if term is fixed)", required: false, placeholder: "1" },
    { key: "modifications", label: "MNDA Modifications", type: "textarea",
      description: "Any modifications to the standard NDA terms", required: false, placeholder: "None" },
  ],
};

const CLOUD_SERVICE: DocumentTypeDef = {
  slug: "cloud-service-agreement",
  displayName: "Cloud Service Agreement",
  description: "A comprehensive agreement for selling and buying cloud software and SaaS products.",
  party1Label: "Provider",
  party2Label: "Customer",
  pdfFilename: "cloud-service-agreement.pdf",
  jurisdictionLabel: "Chosen Courts",
  extraFields: [
    { key: "cloud_service_name", label: "Cloud Service Name", type: "text",
      description: "Name of the cloud service or product", placeholder: "e.g. Acme SaaS Platform" },
    { key: "subscription_period", label: "Subscription Period", type: "text",
      description: "Duration of each subscription period", placeholder: "e.g. 1 year" },
    { key: "fees", label: "Fees", type: "text",
      description: "Fee amount and billing structure", placeholder: "e.g. $1,000/month" },
    { key: "payment_process", label: "Payment Process", type: "select",
      description: "How payments are collected", options: ["invoicing", "automatic payment"] },
    { key: "general_cap_amount", label: "General Liability Cap", type: "text",
      description: "Maximum total cumulative liability", placeholder: "e.g. fees paid in the prior 12 months" },
    { key: "increased_cap_amount", label: "Increased Cap Amount", type: "text",
      description: "Cap for indemnification and elevated claims", placeholder: "e.g. 2x fees paid in prior 12 months" },
    { key: "additional_warranties", label: "Additional Warranties", type: "textarea",
      description: "Additional warranties beyond standard terms", required: false, placeholder: "None" },
  ],
};

const DESIGN_PARTNER: DocumentTypeDef = {
  slug: "design-partner-agreement",
  displayName: "Design Partner Agreement",
  description: "An agreement for early product access where partners provide feedback in exchange for using pre-release software.",
  party1Label: "Provider",
  party2Label: "Partner",
  pdfFilename: "design-partner-agreement.pdf",
  jurisdictionLabel: "Chosen Courts",
  extraFields: [
    { key: "product_name", label: "Product Name", type: "text",
      description: "Name of the product being evaluated", placeholder: "e.g. Acme AI Platform" },
    { key: "program_description", label: "Program Description", type: "textarea",
      description: "Description of the design partner program", placeholder: "e.g. Early access to beta features in exchange for structured weekly feedback sessions" },
    { key: "term", label: "Term", type: "text",
      description: "Duration of the agreement", placeholder: "e.g. 6 months" },
    { key: "fees", label: "Fees", type: "text",
      description: "Fees payable by Partner, if any", placeholder: "e.g. None" },
    { key: "notice_address_provider", label: "Provider Notice Address", type: "text",
      description: "Email or address for notices to Provider", placeholder: "e.g. legal@acme.com" },
    { key: "notice_address_partner", label: "Partner Notice Address", type: "text",
      description: "Email or address for notices to Partner", placeholder: "e.g. partner@example.com" },
  ],
};

const SERVICE_LEVEL: DocumentTypeDef = {
  slug: "service-level-agreement",
  displayName: "Service Level Agreement",
  description: "A standard SLA defining uptime targets, response time commitments, service credits, and remedies.",
  party1Label: "Provider",
  party2Label: "Customer",
  pdfFilename: "service-level-agreement.pdf",
  extraFields: [
    { key: "service_name", label: "Service Name", type: "text",
      description: "Name of the cloud service covered by this SLA", placeholder: "e.g. Acme SaaS Platform" },
    { key: "uptime_target", label: "Uptime Target", type: "text",
      description: "Target monthly availability percentage", placeholder: "e.g. 99.9%" },
    { key: "critical_response_time", label: "Critical Issue Response Time", type: "text",
      description: "Response time for severity-1 issues", placeholder: "e.g. 1 hour" },
    { key: "high_response_time", label: "High Severity Response Time", type: "text",
      description: "Response time for severity-2 issues", placeholder: "e.g. 4 hours" },
    { key: "maintenance_window", label: "Maintenance Window", type: "text",
      description: "Scheduled maintenance window", placeholder: "e.g. Sundays 2–4 AM UTC" },
    { key: "service_credit_percentage", label: "Service Credit Per Incident", type: "text",
      description: "Service credit percentage per SLA breach", placeholder: "e.g. 10%" },
    { key: "maximum_annual_credit", label: "Maximum Annual Credit", type: "text",
      description: "Maximum total service credit per year", placeholder: "e.g. 30% of monthly fees" },
  ],
};

const PROFESSIONAL_SERVICES: DocumentTypeDef = {
  slug: "professional-services-agreement",
  displayName: "Professional Services Agreement",
  description: "An agreement for professional services engagements covering deliverables, IP, and payment.",
  party1Label: "Provider",
  party2Label: "Customer",
  pdfFilename: "professional-services-agreement.pdf",
  extraFields: [
    { key: "services_description", label: "Services Description", type: "textarea",
      description: "Description of services to be performed", placeholder: "e.g. Software development and implementation services" },
    { key: "deliverables", label: "Key Deliverables", type: "textarea",
      description: "List of key deliverables", placeholder: "e.g. Working software; technical documentation; training" },
    { key: "fees", label: "Fees", type: "text",
      description: "Fee amount and structure", placeholder: "e.g. $15,000 fixed fee, or $200/hour" },
    { key: "payment_schedule", label: "Payment Schedule", type: "text",
      description: "When and how fees are paid", placeholder: "e.g. 50% upfront, 50% on delivery" },
    { key: "ip_ownership", label: "Work Product Ownership", type: "select",
      description: "Who owns the work product",
      options: ["Customer owns all work product", "Provider owns all work product", "Joint ownership"] },
    { key: "change_order_process", label: "Change Order Process", type: "textarea",
      description: "How changes to scope are handled", required: false, placeholder: "e.g. Written change orders signed by both parties" },
  ],
};

const PARTNERSHIP: DocumentTypeDef = {
  slug: "partnership-agreement",
  displayName: "Partnership Agreement",
  description: "A standard agreement for business partnerships covering cooperation, trademark licensing, fees, and liability.",
  party1Label: "Company",
  party2Label: "Partner",
  pdfFilename: "partnership-agreement.pdf",
  jurisdictionLabel: "Chosen Courts",
  extraFields: [
    { key: "partnership_purpose", label: "Partnership Purpose", type: "textarea",
      description: "The purpose and scope of the partnership", placeholder: "e.g. Co-marketing and reselling Provider's software products" },
    { key: "territory", label: "Territory", type: "text",
      description: "Geographic scope of the partnership", placeholder: "e.g. United States and Canada" },
    { key: "term_length", label: "Term Length", type: "text",
      description: "Duration of the agreement", placeholder: "e.g. 2 years" },
    { key: "partner_fees", label: "Partner Fees", type: "text",
      description: "Fees payable by Partner to Company, if any", placeholder: "e.g. None, or $5,000/year" },
    { key: "revenue_share", label: "Revenue Share", type: "text",
      description: "Revenue sharing or commission arrangement", placeholder: "e.g. 20% commission on referred sales" },
    { key: "trademark_license_scope", label: "Trademark License Scope", type: "text",
      description: "Scope of trademark and brand usage rights",
      placeholder: "e.g. Non-exclusive right to display Company logo in approved marketing materials" },
  ],
};

const SOFTWARE_LICENSE: DocumentTypeDef = {
  slug: "software-license-agreement",
  displayName: "Software License Agreement",
  description: "A comprehensive license agreement for on-premise or installable software.",
  party1Label: "Licensor",
  party2Label: "Licensee",
  pdfFilename: "software-license-agreement.pdf",
  extraFields: [
    { key: "software_name", label: "Software Name", type: "text",
      description: "Name of the licensed software", placeholder: "e.g. Acme Enterprise Suite" },
    { key: "license_type", label: "License Type", type: "select",
      description: "Type of license granted",
      options: ["Perpetual", "Annual subscription", "Named-user", "Site license"] },
    { key: "number_of_seats", label: "Authorized Users", type: "text",
      description: "Permitted number of users or installations", placeholder: "e.g. 50 named users" },
    { key: "license_fee", label: "License Fee", type: "text",
      description: "One-time or annual license fee", placeholder: "e.g. $50,000 one-time fee" },
    { key: "maintenance_and_support", label: "Maintenance & Support", type: "text",
      description: "Annual maintenance and support fee", placeholder: "e.g. 20% of license fee per year" },
    { key: "delivery_method", label: "Delivery Method", type: "select",
      description: "How the software is delivered",
      options: ["Electronic download", "Physical media", "Both"] },
  ],
};

const DATA_PROCESSING: DocumentTypeDef = {
  slug: "data-processing-agreement",
  displayName: "Data Processing Agreement",
  description: "A GDPR-compliant DPA covering data protection obligations, subprocessors, and security requirements.",
  party1Label: "Controller",
  party2Label: "Processor",
  pdfFilename: "data-processing-agreement.pdf",
  extraFields: [
    { key: "service_description", label: "Service Description", type: "textarea",
      description: "Description of services for which data is processed",
      placeholder: "e.g. Cloud-based HR management platform" },
    { key: "data_types", label: "Types of Personal Data", type: "textarea",
      description: "Categories of personal data being processed",
      placeholder: "e.g. Name, email address, employment information" },
    { key: "data_subjects", label: "Data Subjects", type: "text",
      description: "Categories of individuals whose data is processed",
      placeholder: "e.g. Controller's employees and job applicants" },
    { key: "processing_purposes", label: "Processing Purposes", type: "textarea",
      description: "Purposes for which personal data is processed",
      placeholder: "e.g. Providing HR management features as described in the services agreement" },
    { key: "retention_period", label: "Retention Period", type: "text",
      description: "How long personal data is retained", placeholder: "e.g. Duration of agreement plus 30 days" },
    { key: "security_measures", label: "Security Measures", type: "textarea",
      description: "Technical and organizational security measures",
      placeholder: "e.g. Encryption at rest and in transit, annual pen testing, SOC 2 Type II" },
    { key: "sub_processors", label: "Approved Sub-Processors", type: "textarea",
      description: "List of approved sub-processors", required: false,
      placeholder: "e.g. AWS (cloud infrastructure), Stripe (payments)" },
  ],
};

const PILOT: DocumentTypeDef = {
  slug: "pilot-agreement",
  displayName: "Pilot Agreement",
  description: "A short-term trial agreement allowing customers to evaluate a product before committing long-term.",
  party1Label: "Provider",
  party2Label: "Customer",
  pdfFilename: "pilot-agreement.pdf",
  extraFields: [
    { key: "product_name", label: "Product Name", type: "text",
      description: "Name of the product being evaluated", placeholder: "e.g. Acme AI Platform" },
    { key: "pilot_period", label: "Pilot Period", type: "text",
      description: "Duration of the pilot", placeholder: "e.g. 90 days" },
    { key: "pilot_users", label: "Pilot Users", type: "text",
      description: "Maximum number of users permitted during the pilot", placeholder: "e.g. Up to 20 users" },
    { key: "success_criteria", label: "Success Criteria", type: "textarea",
      description: "Measurable criteria for evaluating pilot success",
      placeholder: "e.g. Processing 100+ transactions/day with <1% error rate" },
    { key: "pilot_fee", label: "Pilot Fee", type: "text",
      description: "Fee for the pilot period, if any", placeholder: "e.g. Complimentary, or $2,500 flat fee" },
    { key: "post_pilot_pricing", label: "Post-Pilot Pricing", type: "text",
      description: "Pricing after a successful pilot", required: false,
      placeholder: "e.g. $1,000/month enterprise plan" },
  ],
};

const BUSINESS_ASSOCIATE: DocumentTypeDef = {
  slug: "business-associate-agreement",
  displayName: "Business Associate Agreement",
  description: "A HIPAA-compliant BAA for business associates handling protected health information (PHI).",
  party1Label: "Covered Entity",
  party2Label: "Business Associate",
  pdfFilename: "business-associate-agreement.pdf",
  extraFields: [
    { key: "services_description", label: "Services Description", type: "textarea",
      description: "Services performed by Business Associate on behalf of Covered Entity",
      placeholder: "e.g. Medical billing and claims processing services" },
    { key: "phi_permitted_uses", label: "Permitted Uses of PHI", type: "textarea",
      description: "Specific permitted uses of PHI",
      placeholder: "e.g. Performing billing services; as required by law" },
    { key: "phi_permitted_disclosures", label: "Permitted Disclosures of PHI", type: "textarea",
      description: "Specific permitted disclosures of PHI",
      placeholder: "e.g. To payers and clearinghouses for claims processing" },
    { key: "security_contact", label: "Security Incident Contact", type: "text",
      description: "Contact for reporting security incidents", placeholder: "e.g. security@businessassociate.com" },
    { key: "breach_notification_days", label: "Breach Notification Period", type: "text",
      description: "Days within which breaches must be reported", placeholder: "e.g. 60 days from discovery" },
    { key: "termination_procedure", label: "Return/Destruction of PHI", type: "textarea",
      description: "Procedure for returning or destroying PHI on termination",
      placeholder: "e.g. Return or securely destroy all PHI within 30 days of termination" },
  ],
};

const AI_ADDENDUM: DocumentTypeDef = {
  slug: "ai-addendum",
  displayName: "AI Addendum",
  description: "An addendum for agreements involving AI/ML features, covering input/output ownership and model training restrictions.",
  party1Label: "Provider",
  party2Label: "Customer",
  pdfFilename: "ai-addendum.pdf",
  extraFields: [
    { key: "ai_features_description", label: "AI Features Description", type: "textarea",
      description: "Description of the AI/ML features covered by this addendum",
      placeholder: "e.g. AI-powered document analysis and generation features" },
    { key: "base_agreement_name", label: "Base Agreement Name", type: "text",
      description: "The underlying agreement this addendum modifies",
      placeholder: "e.g. Cloud Service Agreement dated January 1, 2026" },
    { key: "input_ownership", label: "Input Ownership", type: "select",
      description: "Who owns Customer's inputs to AI features",
      options: ["Customer owns all inputs", "Shared ownership", "Provider owns all inputs"] },
    { key: "output_ownership", label: "Output Ownership", type: "select",
      description: "Who owns outputs generated by AI features",
      options: ["Customer owns all outputs", "Shared ownership", "Provider owns all outputs"] },
    { key: "model_training_restrictions", label: "Model Training Policy", type: "select",
      description: "Whether Customer data may be used for model training",
      options: [
        "Customer data may not be used for model training",
        "Customer data may be used for training with Customer's prior consent",
        "Customer data may be used for model training",
      ] },
    { key: "additional_ai_terms", label: "Additional AI Terms", type: "textarea",
      description: "Any additional terms specific to AI usage", required: false,
      placeholder: "e.g. Provider will maintain a publicly available AI ethics policy" },
  ],
};

export const DOCUMENT_REGISTRY: Record<string, DocumentTypeDef> = {
  "mutual-nda": MUTUAL_NDA,
  "mutual-nda-coverpage": MUTUAL_NDA, // alias
  "cloud-service-agreement": CLOUD_SERVICE,
  "design-partner-agreement": DESIGN_PARTNER,
  "service-level-agreement": SERVICE_LEVEL,
  "professional-services-agreement": PROFESSIONAL_SERVICES,
  "partnership-agreement": PARTNERSHIP,
  "software-license-agreement": SOFTWARE_LICENSE,
  "data-processing-agreement": DATA_PROCESSING,
  "pilot-agreement": PILOT,
  "business-associate-agreement": BUSINESS_ASSOCIATE,
  "ai-addendum": AI_ADDENDUM,
};

/** All catalog entries in display order (matching catalog.json) */
export const CATALOG_ORDER: string[] = [
  "mutual-nda",
  "mutual-nda-coverpage",
  "cloud-service-agreement",
  "design-partner-agreement",
  "service-level-agreement",
  "professional-services-agreement",
  "partnership-agreement",
  "software-license-agreement",
  "data-processing-agreement",
  "pilot-agreement",
  "business-associate-agreement",
  "ai-addendum",
];
