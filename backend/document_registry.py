"""Registry of all supported legal document types with their field definitions."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

FieldType = Literal["text", "textarea", "date", "select", "integer"]


@dataclass(frozen=True)
class FieldDef:
    key: str
    label: str
    field_type: FieldType
    description: str
    options: tuple[str, ...] = field(default_factory=tuple)
    placeholder: str = ""
    required: bool = True


@dataclass(frozen=True)
class DocumentTypeDef:
    slug: str
    display_name: str
    description: str
    party1_label: str
    party2_label: str
    extra_fields: tuple[FieldDef, ...]
    markdown_template: str  # filename in /templates/ for standard terms
    pdf_cover_template: str  # filename in backend/templates/ for cover page Jinja2
    pdf_filename: str
    jurisdiction_label: str = "Jurisdiction"


_MUTUAL_NDA = DocumentTypeDef(
    slug="mutual-nda",
    display_name="Mutual Non-Disclosure Agreement",
    description="A standard mutual NDA for protecting confidential information exchanged between two parties.",
    party1_label="Party 1",
    party2_label="Party 2",
    extra_fields=(
        FieldDef("purpose", "Purpose", "textarea", "How Confidential Information may be used",
                 placeholder="Evaluating whether to enter into a business relationship with the other party."),
        FieldDef("mnda_term_type", "MNDA Term", "select", "How long the MNDA lasts",
                 options=("expires", "continues")),
        FieldDef("mnda_term_years", "MNDA Term (Years)", "integer", "Number of years (if mnda_term_type is 'expires')",
                 required=False, placeholder="1"),
        FieldDef("term_of_confidentiality_type", "Term of Confidentiality", "select",
                 "How long Confidential Information is protected", options=("years", "perpetuity")),
        FieldDef("term_of_confidentiality_years", "Confidentiality Term (Years)", "integer",
                 "Number of years (if term_of_confidentiality_type is 'years')", required=False, placeholder="1"),
        FieldDef("modifications", "MNDA Modifications", "textarea",
                 "Any modifications to the standard NDA terms (leave blank for none)",
                 required=False, placeholder="None"),
    ),
    markdown_template="Mutual-NDA.md",
    pdf_cover_template="mutual-nda_cover.html",
    pdf_filename="mutual-nda.pdf",
)

_CLOUD_SERVICE = DocumentTypeDef(
    slug="cloud-service-agreement",
    display_name="Cloud Service Agreement",
    description="A comprehensive agreement for selling and buying cloud software and SaaS products.",
    party1_label="Provider",
    party2_label="Customer",
    extra_fields=(
        FieldDef("cloud_service_name", "Cloud Service Name", "text",
                 "Name of the cloud service or product", placeholder="e.g. Acme SaaS Platform"),
        FieldDef("subscription_period", "Subscription Period", "text",
                 "Duration of each subscription period", placeholder="e.g. 1 year"),
        FieldDef("fees", "Fees", "text",
                 "Fee amount and billing structure", placeholder="e.g. $1,000/month"),
        FieldDef("payment_process", "Payment Process", "select",
                 "How payments are collected", options=("invoicing", "automatic payment")),
        FieldDef("general_cap_amount", "General Liability Cap Amount", "text",
                 "Maximum total cumulative liability for all claims",
                 placeholder="e.g. fees paid in the prior 12 months"),
        FieldDef("increased_cap_amount", "Increased Cap Amount", "text",
                 "Cap for indemnification and other elevated claims",
                 placeholder="e.g. 2x fees paid in the prior 12 months"),
        FieldDef("additional_warranties", "Additional Warranties", "textarea",
                 "Any additional warranties or SLA commitments beyond the standard terms",
                 required=False, placeholder="None"),
    ),
    markdown_template="Cloud-Service-Agreement.md",
    pdf_cover_template="cloud-service-agreement_cover.html",
    pdf_filename="cloud-service-agreement.pdf",
    jurisdiction_label="Chosen Courts",
)

_DESIGN_PARTNER = DocumentTypeDef(
    slug="design-partner-agreement",
    display_name="Design Partner Agreement",
    description="An agreement for early product access where partners provide feedback in exchange for using pre-release software.",
    party1_label="Provider",
    party2_label="Partner",
    extra_fields=(
        FieldDef("product_name", "Product Name", "text",
                 "Name of the product being evaluated", placeholder="e.g. Acme AI Platform"),
        FieldDef("program_description", "Program Description", "textarea",
                 "Description of the design partner program and what is expected",
                 placeholder="e.g. Early access to beta features in exchange for structured weekly feedback sessions"),
        FieldDef("term", "Term", "text",
                 "Duration of the agreement", placeholder="e.g. 6 months"),
        FieldDef("fees", "Fees", "text",
                 "Fees payable by Partner, if any", placeholder="e.g. None"),
        FieldDef("notice_address_provider", "Provider Notice Address", "text",
                 "Email or postal address for notices to Provider", placeholder="e.g. legal@acme.com"),
        FieldDef("notice_address_partner", "Partner Notice Address", "text",
                 "Email or postal address for notices to Partner", placeholder="e.g. partner@example.com"),
    ),
    markdown_template="Design-Partner-Agreement.md",
    pdf_cover_template="design-partner-agreement_cover.html",
    pdf_filename="design-partner-agreement.pdf",
    jurisdiction_label="Chosen Courts",
)

_SERVICE_LEVEL = DocumentTypeDef(
    slug="service-level-agreement",
    display_name="Service Level Agreement",
    description="A standard SLA defining uptime targets, response time commitments, service credits, and remedies.",
    party1_label="Provider",
    party2_label="Customer",
    extra_fields=(
        FieldDef("service_name", "Service Name", "text",
                 "Name of the cloud service covered by this SLA", placeholder="e.g. Acme SaaS Platform"),
        FieldDef("uptime_target", "Uptime Target", "text",
                 "Target monthly availability percentage", placeholder="e.g. 99.9%"),
        FieldDef("critical_response_time", "Critical Issue Response Time", "text",
                 "Initial response time for severity-1 (service down) issues", placeholder="e.g. 1 hour"),
        FieldDef("high_response_time", "High Severity Response Time", "text",
                 "Initial response time for severity-2 issues", placeholder="e.g. 4 hours"),
        FieldDef("maintenance_window", "Maintenance Window", "text",
                 "Scheduled maintenance window (excluded from uptime calculation)",
                 placeholder="e.g. Sundays 2–4 AM UTC"),
        FieldDef("service_credit_percentage", "Service Credit Per Incident", "text",
                 "Service credit percentage per SLA breach occurrence", placeholder="e.g. 10%"),
        FieldDef("maximum_annual_credit", "Maximum Annual Service Credit", "text",
                 "Maximum total service credit per year", placeholder="e.g. 30% of monthly fees"),
    ),
    markdown_template="Service-Level-Agreement.md",
    pdf_cover_template="service-level-agreement_cover.html",
    pdf_filename="service-level-agreement.pdf",
)

_PROFESSIONAL_SERVICES = DocumentTypeDef(
    slug="professional-services-agreement",
    display_name="Professional Services Agreement",
    description="An agreement for professional services engagements covering deliverables, IP, and payment.",
    party1_label="Provider",
    party2_label="Customer",
    extra_fields=(
        FieldDef("services_description", "Services Description", "textarea",
                 "Description of services to be performed",
                 placeholder="e.g. Software development and implementation services"),
        FieldDef("deliverables", "Key Deliverables", "textarea",
                 "List of key deliverables to be provided",
                 placeholder="e.g. Working software system; technical documentation; training"),
        FieldDef("fees", "Fees", "text",
                 "Fee amount and structure", placeholder="e.g. $15,000 fixed fee, or $200/hour"),
        FieldDef("payment_schedule", "Payment Schedule", "text",
                 "When and how fees are paid",
                 placeholder="e.g. 50% upfront, 50% on delivery"),
        FieldDef("ip_ownership", "Work Product Ownership", "select",
                 "Who owns the work product and deliverables",
                 options=("Customer owns all work product", "Provider owns all work product", "Joint ownership")),
        FieldDef("change_order_process", "Change Order Process", "textarea",
                 "How changes to scope are handled",
                 required=False, placeholder="e.g. Written change orders signed by both parties"),
    ),
    markdown_template="Professional-Services-Agreement.md",
    pdf_cover_template="professional-services-agreement_cover.html",
    pdf_filename="professional-services-agreement.pdf",
)

_PARTNERSHIP = DocumentTypeDef(
    slug="partnership-agreement",
    display_name="Partnership Agreement",
    description="A standard agreement for business partnerships covering cooperation, trademark licensing, fees, and liability.",
    party1_label="Company",
    party2_label="Partner",
    extra_fields=(
        FieldDef("partnership_purpose", "Partnership Purpose", "textarea",
                 "The purpose and scope of the partnership",
                 placeholder="e.g. Co-marketing and reselling Provider's software products"),
        FieldDef("territory", "Territory", "text",
                 "Geographic scope of the partnership", placeholder="e.g. United States and Canada"),
        FieldDef("term_length", "Term Length", "text",
                 "Duration of the agreement", placeholder="e.g. 2 years"),
        FieldDef("partner_fees", "Partner Fees", "text",
                 "Fees payable by Partner to Company, if any", placeholder="e.g. None, or $5,000/year"),
        FieldDef("revenue_share", "Revenue Share", "text",
                 "Revenue sharing or commission arrangement",
                 placeholder="e.g. 20% commission on referred sales"),
        FieldDef("trademark_license_scope", "Trademark License Scope", "text",
                 "Scope of trademark and brand usage rights granted to Partner",
                 placeholder="e.g. Non-exclusive right to display Company logo in approved marketing materials"),
    ),
    markdown_template="Partnership-Agreement.md",
    pdf_cover_template="partnership-agreement_cover.html",
    pdf_filename="partnership-agreement.pdf",
    jurisdiction_label="Chosen Courts",
)

_SOFTWARE_LICENSE = DocumentTypeDef(
    slug="software-license-agreement",
    display_name="Software License Agreement",
    description="A comprehensive license agreement for on-premise or installable software.",
    party1_label="Licensor",
    party2_label="Licensee",
    extra_fields=(
        FieldDef("software_name", "Software Name", "text",
                 "Name of the licensed software", placeholder="e.g. Acme Enterprise Suite"),
        FieldDef("license_type", "License Type", "select",
                 "Type of license granted",
                 options=("Perpetual", "Annual subscription", "Named-user", "Site license")),
        FieldDef("number_of_seats", "Number of Authorized Users", "text",
                 "Permitted number of users or installations", placeholder="e.g. 50 named users"),
        FieldDef("license_fee", "License Fee", "text",
                 "One-time or annual license fee", placeholder="e.g. $50,000 one-time fee"),
        FieldDef("maintenance_and_support", "Maintenance & Support", "text",
                 "Annual maintenance and support fee",
                 placeholder="e.g. 20% of license fee per year"),
        FieldDef("delivery_method", "Delivery Method", "select",
                 "How the software is delivered to Licensee",
                 options=("Electronic download", "Physical media", "Both")),
    ),
    markdown_template="Software-License-Agreement.md",
    pdf_cover_template="software-license-agreement_cover.html",
    pdf_filename="software-license-agreement.pdf",
)

_DATA_PROCESSING = DocumentTypeDef(
    slug="data-processing-agreement",
    display_name="Data Processing Agreement",
    description="A GDPR-compliant DPA covering data protection obligations, subprocessors, and security requirements.",
    party1_label="Controller",
    party2_label="Processor",
    extra_fields=(
        FieldDef("service_description", "Service Description", "textarea",
                 "Description of the services for which Controller's data is processed",
                 placeholder="e.g. Cloud-based HR management platform"),
        FieldDef("data_types", "Types of Personal Data", "textarea",
                 "Categories of personal data being processed",
                 placeholder="e.g. Name, email address, employment information, payroll data"),
        FieldDef("data_subjects", "Data Subjects", "text",
                 "Categories of individuals whose data is processed",
                 placeholder="e.g. Controller's employees and job applicants"),
        FieldDef("processing_purposes", "Processing Purposes", "textarea",
                 "Specific purposes for which the personal data is processed",
                 placeholder="e.g. Providing HR management features as described in the services agreement"),
        FieldDef("retention_period", "Retention Period", "text",
                 "How long personal data is retained before deletion",
                 placeholder="e.g. Duration of the services agreement plus 30 days"),
        FieldDef("security_measures", "Security Measures", "textarea",
                 "Technical and organizational security measures implemented by Processor",
                 placeholder="e.g. Encryption at rest and in transit, annual penetration testing, SOC 2 Type II"),
        FieldDef("sub_processors", "Approved Sub-Processors", "textarea",
                 "List of approved sub-processors and their roles",
                 required=False, placeholder="e.g. AWS (cloud infrastructure), Stripe (payments)"),
    ),
    markdown_template="Data-Processing-Agreement.md",
    pdf_cover_template="data-processing-agreement_cover.html",
    pdf_filename="data-processing-agreement.pdf",
)

_PILOT = DocumentTypeDef(
    slug="pilot-agreement",
    display_name="Pilot Agreement",
    description="A short-term trial agreement allowing customers to evaluate a product before committing long-term.",
    party1_label="Provider",
    party2_label="Customer",
    extra_fields=(
        FieldDef("product_name", "Product Name", "text",
                 "Name of the product being evaluated during the pilot",
                 placeholder="e.g. Acme AI Platform"),
        FieldDef("pilot_period", "Pilot Period", "text",
                 "Duration of the pilot", placeholder="e.g. 90 days"),
        FieldDef("pilot_users", "Number of Pilot Users", "text",
                 "Maximum number of users permitted during the pilot",
                 placeholder="e.g. Up to 20 users"),
        FieldDef("success_criteria", "Success Criteria", "textarea",
                 "Measurable criteria for evaluating pilot success",
                 placeholder="e.g. Processing 100+ transactions/day with <1% error rate"),
        FieldDef("pilot_fee", "Pilot Fee", "text",
                 "Fee for the pilot period, if any",
                 placeholder="e.g. Complimentary, or $2,500 flat fee"),
        FieldDef("post_pilot_pricing", "Post-Pilot Pricing", "text",
                 "Pricing available to Customer after a successful pilot",
                 required=False, placeholder="e.g. $1,000/month enterprise plan"),
    ),
    markdown_template="Pilot-Agreement.md",
    pdf_cover_template="pilot-agreement_cover.html",
    pdf_filename="pilot-agreement.pdf",
)

_BUSINESS_ASSOCIATE = DocumentTypeDef(
    slug="business-associate-agreement",
    display_name="Business Associate Agreement",
    description="A HIPAA-compliant BAA for business associates handling protected health information (PHI).",
    party1_label="Covered Entity",
    party2_label="Business Associate",
    extra_fields=(
        FieldDef("services_description", "Services Description", "textarea",
                 "Description of services performed by Business Associate on behalf of Covered Entity",
                 placeholder="e.g. Medical billing and claims processing services"),
        FieldDef("phi_permitted_uses", "Permitted Uses of PHI", "textarea",
                 "Specific permitted uses of protected health information",
                 placeholder="e.g. Performing billing services; as required by law; for proper management of Business Associate"),
        FieldDef("phi_permitted_disclosures", "Permitted Disclosures of PHI", "textarea",
                 "Specific permitted disclosures of protected health information",
                 placeholder="e.g. To payers and clearinghouses for claims processing"),
        FieldDef("security_contact", "Security Incident Contact", "text",
                 "Contact email or information for reporting security incidents",
                 placeholder="e.g. security@businessassociate.com"),
        FieldDef("breach_notification_days", "Breach Notification Period", "text",
                 "Number of days within which Business Associate must report breaches",
                 placeholder="e.g. 60 days from discovery"),
        FieldDef("termination_procedure", "Return/Destruction of PHI", "textarea",
                 "Procedure for returning or destroying PHI upon termination",
                 placeholder="e.g. Return or securely destroy all PHI within 30 days of termination"),
    ),
    markdown_template="Business-Associate-Agreement.md",
    pdf_cover_template="business-associate-agreement_cover.html",
    pdf_filename="business-associate-agreement.pdf",
)

_AI_ADDENDUM = DocumentTypeDef(
    slug="ai-addendum",
    display_name="AI Addendum",
    description="An addendum for agreements involving AI/ML features, covering input/output ownership and model training restrictions.",
    party1_label="Provider",
    party2_label="Customer",
    extra_fields=(
        FieldDef("ai_features_description", "AI Features Description", "textarea",
                 "Description of the AI/ML features covered by this addendum",
                 placeholder="e.g. AI-powered document analysis and generation features in the Platform"),
        FieldDef("base_agreement_name", "Base Agreement Name", "text",
                 "Name of the underlying agreement this addendum modifies",
                 placeholder="e.g. Cloud Service Agreement dated January 1, 2026"),
        FieldDef("input_ownership", "Customer Input Ownership", "select",
                 "Who owns Customer's inputs to AI features",
                 options=("Customer owns all inputs", "Shared ownership", "Provider owns all inputs")),
        FieldDef("output_ownership", "AI Output Ownership", "select",
                 "Who owns outputs generated by AI features",
                 options=("Customer owns all outputs", "Shared ownership", "Provider owns all outputs")),
        FieldDef("model_training_restrictions", "Model Training Policy", "select",
                 "Whether Customer data may be used for AI model training",
                 options=("Customer data may not be used for model training",
                          "Customer data may be used for training with Customer's prior consent",
                          "Customer data may be used for model training")),
        FieldDef("additional_ai_terms", "Additional AI Terms", "textarea",
                 "Any additional terms specific to AI usage",
                 required=False, placeholder="e.g. Provider will maintain a publicly available AI ethics policy"),
    ),
    markdown_template="AI-Addendum.md",
    pdf_cover_template="ai-addendum_cover.html",
    pdf_filename="ai-addendum.pdf",
)


DOCUMENT_REGISTRY: dict[str, DocumentTypeDef] = {
    d.slug: d
    for d in [
        _MUTUAL_NDA,
        _CLOUD_SERVICE,
        _DESIGN_PARTNER,
        _SERVICE_LEVEL,
        _PROFESSIONAL_SERVICES,
        _PARTNERSHIP,
        _SOFTWARE_LICENSE,
        _DATA_PROCESSING,
        _PILOT,
        _BUSINESS_ASSOCIATE,
        _AI_ADDENDUM,
    ]
}

# "Mutual NDA Cover Page" catalog entry maps to the same editor as Mutual NDA
DOCUMENT_REGISTRY["mutual-nda-coverpage"] = _MUTUAL_NDA
