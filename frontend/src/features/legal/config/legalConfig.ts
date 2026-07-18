export const legalConfig = {
  platformName: "JBC Athenaeum",
  operatorName: "Nirmal Sanjel",
  operatingCountry: "Nepal",
  productionUrl: "https://jbc.nirmalsanjel.com.np",
  legalContactEmail: "admin@nirmalsanjel.com.np",
  privacyContactEmail: "admin@nirmalsanjel.com.np",
  copyrightContactEmail: "admin@nirmalsanjel.com.np",
  securityContactEmail: "admin@nirmalsanjel.com.np",
  firstPublicationYear: 2026,
  currentYear: 2026,
  policyVersion: "1.0",
  effectiveDate: "2026-07-18",
  lastUpdated: "2026-07-18",
} as const;

export const uploadPolicyAcceptance = {
  slug: "upload",
  version: legalConfig.policyVersion,
  label:
    "I confirm that I have the right to upload and share this resource, that the metadata is accurate, and that the file does not contain prohibited personal data, credentials, malware, or confidential information.",
} as const;

export const uploadLimits = {
  currentFileTypes: "PDF files only",
  maxBytes: 26_214_400,
  maxMegabytesLabel: "25 MB",
  maxPagesLabel: "5,000 pages",
  uploadSessionLabel:
    "Configured upload session window; current default is 120 minutes.",
} as const;

export const retentionConfig = {
  activeAccountData:
    "For the account lifetime, then reviewed during account deletion.",
  authenticationData:
    "Provider-controlled or configured expiry and revocation.",
  publishedResources:
    "While lawfully published, unless removed, archived, or restricted.",
  rejectedUploads:
    "Proposed retention period - requires administrator and legal approval.",
  temporaryUploads:
    "Short configured period; upload sessions currently default to 120 minutes before cleanup eligibility.",
  resourceVersions:
    "Configurable; superseded versions may be archived or deleted after review.",
  downloadEvents:
    "Configurable analytics period; authenticated history is visible to the signed-in user.",
  anonymousAnalytics:
    "Longer where records are aggregated and not reasonably identifying.",
  bookmarks:
    "Until the user removes the bookmark or the account deletion workflow removes it.",
  ratings:
    "While active, unless removed, hidden, or anonymized during account deletion.",
  notifications:
    "Proposed retention period - requires administrator and legal approval.",
  auditRecords:
    "Longer restricted security period; final period requires administrator and legal approval.",
  reports:
    "Dispute-dependent; retained while needed for review, legal, or abuse handling.",
  supportMessages:
    "Proposed retention period - requires administrator and legal approval.",
  newsletterRecords:
    "Until unsubscribe, with minimal suppression records where needed.",
  deviceRecords:
    "Until logout, token expiry, revocation, or account deletion review.",
  paymentRecords:
    "Not active for document access; future paid features require a legal/accounting retention schedule.",
  backups:
    "Provider or approved backup rotation; not deleted instantly from every backup snapshot.",
  securityLogs:
    "Limited security period - requires administrator and legal approval.",
  accountDeletionProof:
    "Limited proof period - requires administrator and legal approval.",
  resourcePermanentDeletion:
    "Published resources use soft archive first; permanent deletion is gated for at least 90 archived days.",
} as const;

export const nepalLawReferences = [
  "The Privacy Act, 2075",
  "The Copyright Act, 2059",
  "The Electronic Transactions Act, 2063",
  "The Consumer Protection Act, 2075",
  "The Payment and Settlement Act, 2075, if paid services are introduced",
  "Other applicable Nepalese laws, regulations, court orders, and lawful government orders",
] as const;
