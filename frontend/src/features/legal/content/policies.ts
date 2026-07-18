import {
  BookOpenCheck,
  Database,
  FileArchive,
  FileText,
  Scale,
  ShieldCheck,
} from "lucide-react";
import {
  legalConfig,
  nepalLawReferences,
  retentionConfig,
  uploadLimits,
} from "../config/legalConfig";
import type { PolicyBlock, PolicyDocument, PolicySlug } from "../types";

const independenceText =
  "JBC Athenaeum is an independently operated academic resource platform. References to Jana Bhawana Campus, Tribhuvan University, faculties, programs, courses, and subjects are descriptive and do not imply official endorsement unless expressly stated.";

const operationalLicenseText =
  "When a user submits content, the user does not transfer ownership to JBC Athenaeum. The user grants JBC Athenaeum a non-exclusive, royalty-free, limited licence to store, process, validate, review, scan where available, generate previews, format, display, distribute, promote within the platform, maintain versions of, archive, remove, and otherwise use the content only as needed to operate, secure, moderate, improve, and enforce the Platform. The licence may be sublicensed only to service providers necessary to operate the Platform and remains subject to removal, retention, legal, backup, dispute, and already-distributed-copy limitations.";

const accountDeletionText =
  "Account deletion may require identity verification and review for legal, security, copyright, payment, moderation, audit, and backup obligations. Some records may be deleted, some may be anonymized, and some may be retained for a limited legitimate purpose. Published resources may be removed, retained with attribution removed, or retained under the licence previously granted, depending on the contributor's request, rights evidence, public-interest considerations, institutional authorization, and unresolved disputes.";

const contactFormat = (subject: string) =>
  `Email ${legalConfig.legalContactEmail} with the subject "${subject}". Include enough detail to identify your account, resource, request, and authority to act.`;

const sharedDefinitions: PolicyBlock = {
  type: "definitions",
  terms: [
    {
      term: "JBC Athenaeum, we, us, or our",
      description: `${legalConfig.platformName}, operated by ${legalConfig.operatorName}.`,
    },
    {
      term: "Platform or Service",
      description:
        "The website, PWA, current web application, and any future official mobile application operated for JBC Athenaeum.",
    },
    {
      term: "User",
      description:
        "A visitor, student, contributor, moderator, administrator, or other person who accesses the Platform.",
    },
    {
      term: "Account",
      description:
        "A Supabase Auth identity and related profile, roles, preferences, notifications, devices, and activity records.",
    },
    {
      term: "Resource",
      description:
        "An academic file, metadata record, PDF, version, preview, link, note, question paper, report, assignment, syllabus, or related academic material on the Platform.",
    },
    {
      term: "Personal Data",
      description:
        "Information that identifies, relates to, or can reasonably be linked to a person, including account data, profile details, uploaded documents, reports, and support messages.",
    },
    {
      term: "Published Resource",
      description:
        "A resource that has passed the applicable workflow and is discoverable or accessible according to its visibility setting.",
    },
    {
      term: "Private Resource",
      description:
        "A draft, temporary, quarantined, rejected, restricted, or review-only resource that is not intentionally published for ordinary public access.",
    },
  ],
};

const legalContextBlock: PolicyBlock = {
  type: "callout",
  title: "Legal context",
  text: `These documents are intended to operate consistently with applicable laws of Nepal, including ${nepalLawReferences.join(", ")}. They do not claim that compliance has been finally verified, and they should be reviewed by a qualified legal professional in Nepal before commercial deployment.`,
};

const privacy: PolicyDocument = {
  slug: "privacy",
  path: "/privacy",
  title: "Privacy Policy",
  shortTitle: "Privacy",
  summary:
    "How JBC Athenaeum collects, uses, stores, protects, shares, and retains account, resource, upload, moderation, and activity data.",
  description:
    "Privacy Policy for JBC Athenaeum, including Supabase Auth, database records, private Storage, signed URLs, PWA storage, uploads, reports, notifications, and deletion requests.",
  version: legalConfig.policyVersion,
  effectiveDate: legalConfig.effectiveDate,
  lastUpdated: legalConfig.lastUpdated,
  icon: ShieldCheck,
  relatedSlugs: ["terms", "copyright", "upload", "retention"],
  sections: [
    {
      id: "introduction",
      heading: "Introduction",
      blocks: [
        {
          type: "paragraph",
          text: `${legalConfig.platformName} is operated by ${legalConfig.operatorName} in Nepal as an academic resource platform for discovering, uploading, reviewing, accessing, and managing study materials.`,
        },
        { type: "paragraph", text: independenceText },
        {
          type: "paragraph",
          text: "This Privacy Policy applies to the website, PWA, and any future official mobile application. Third-party websites, payment apps, banks, cloud providers, and linked resources are governed by their own privacy practices.",
        },
        sharedDefinitions,
        legalContextBlock,
      ],
    },
    {
      id: "responsible-operator",
      heading: "Responsible operator",
      blocks: [
        {
          type: "paragraph",
          text: `${legalConfig.platformName} is operated by ${legalConfig.operatorName}, Nepal. Legal classifications such as data controller, processor, or responsible operator may depend on applicable law and the facts of a particular processing activity.`,
        },
        {
          type: "paragraph",
          text: `Privacy contact: ${legalConfig.privacyContactEmail}. No physical mailing address, business registration number, VAT/PAN number, or institutional legal representative has been configured in this repository.`,
        },
      ],
    },
    {
      id: "information-users-provide",
      heading: "Information users provide",
      blocks: [
        {
          type: "list",
          items: [
            "Account information such as name, display name, email address, faculty or program, profile image URL, biography, account status, roles, and MFA configuration.",
            "Password credentials handled by Supabase Auth. Raw passwords should not be available to JBC Athenaeum when authentication is properly handled by Supabase.",
            "Resource uploads and metadata, including title, description, campus, faculty, program, semester or term, subject, category, academic year, original filename, file size, PDF metadata, checksums, and version history.",
            "Contribution activity, review decisions, moderator comments, rejection reasons, resubmission records, bookmarks, ratings, review text, download history, notification preferences, device records, and account preferences.",
            "Reports, copyright-removal requests, feedback, newsletter subscriptions, support correspondence, and account-deletion requests.",
          ],
        },
      ],
    },
    {
      id: "automatic-collection",
      heading: "Automatically collected information",
      blocks: [
        {
          type: "paragraph",
          text: "The Platform may process IP address, browser type, device type, operating system, language, referring URL, pages viewed, resource interactions, download events, authentication events, session identifiers, timestamps, app version, device platform, error details, and security logs.",
        },
        {
          type: "list",
          items: [
            "Personalized account activity includes authenticated uploads, bookmarks, ratings, notifications, device records, and signed-in download history.",
            "Anonymous or aggregated analytics may include public platform counts, download totals, storage totals, and non-identifying usage metrics.",
            "Security and abuse-prevention records may include audit events, account status changes, role changes, failed validation records, report cooldown signals, and sanitized client errors.",
          ],
        },
      ],
    },
    {
      id: "database-storage",
      heading: "Database and storage infrastructure",
      blocks: [
        {
          type: "paragraph",
          text: "Application records are stored in structured Supabase-hosted PostgreSQL database tables. Access is restricted through authenticated sessions, database authorization rules, role-based permissions, Row Level Security, and server-controlled functions. These controls reduce unauthorized access risk but cannot guarantee absolute security.",
        },
        {
          type: "paragraph",
          text: "Records may be linked using internal UUID identifiers. The public policy does not publish service-role keys, connection strings, exact storage paths, SQL policy definitions, signing secrets, or internal anti-abuse thresholds.",
        },
        {
          type: "paragraph",
          text: "The Platform may use Supabase Authentication, PostgreSQL, private Storage, Edge Functions, database functions, signed URLs, audit records, backups, and operational infrastructure. Cloudflare may provide hosting, routing, HTTPS, and platform delivery for the public web application.",
        },
      ],
    },
    {
      id: "file-storage",
      heading: "File storage",
      blocks: [
        {
          type: "paragraph",
          text: "The current secure publication pipeline accepts user-uploaded PDFs. Files may enter temporary or quarantine Storage while under validation and moderation. Approved files may be copied to private published Storage and accessed through short-lived signed URLs.",
        },
        {
          type: "list",
          items: [
            "A resource may remain private while under review, rejected, changes-requested, restricted, or archived.",
            "Published resources may become publicly discoverable depending on their assigned visibility.",
            "Signed URLs expire and should not be treated as permanent public links.",
            "Database rows and Storage objects are separate records, so deletion can require both a database update and a Storage cleanup job.",
          ],
        },
      ],
    },
    {
      id: "purposes",
      heading: "Purposes of processing",
      blocks: [
        {
          type: "list",
          items: [
            "Create and maintain accounts, authenticate users, verify email status, support MFA, and protect account security.",
            "Provide academic resource search, access, upload, validation, moderation, publication, download tracking, bookmarks, ratings, notifications, and account pages.",
            "Handle reports, copyright complaints, content-removal requests, support messages, feedback, newsletter subscriptions, and abuse investigations.",
            "Maintain audit trails, secure private Storage, preserve version history, operate backups, comply with legal obligations, prevent fraud, and enforce platform policies.",
            "Improve functionality through operational metrics and sanitized error reporting. The Platform does not currently describe advertising profiling as an active purpose.",
          ],
        },
      ],
    },
    {
      id: "legal-operational-grounds",
      heading: "Legal and operational grounds",
      blocks: [
        {
          type: "paragraph",
          text: "Processing may be based on providing requested services, user consent where applicable, performance of agreements, legitimate operational and security interests, protection of users and the Platform, compliance with legal obligations, and handling legal or copyright claims.",
        },
        {
          type: "paragraph",
          text: "The Platform does not claim GDPR compliance as a verified operating framework. Requests from users in other jurisdictions will be assessed under applicable law and technical capability.",
        },
      ],
    },
    {
      id: "cookies-storage",
      heading: "Cookies, local storage, and PWA storage",
      blocks: [
        {
          type: "paragraph",
          text: "The active app uses browser storage for essential authentication/session behavior managed by Supabase, contribution draft saving, query caching, PWA installation/update state, offline application shell caching, and security or routing recovery state.",
        },
        {
          type: "paragraph",
          text: "Supabase API, authentication, Storage object, function, and payment-like URLs are configured for network-only service-worker handling so private account and document responses are not intentionally cached by the PWA shell.",
        },
        {
          type: "paragraph",
          text: "No marketing cookies or third-party advertising identifiers are currently implemented in the active app layout. A legacy optional cookie/name preference utility exists in the codebase but is not mounted in the current route layout.",
        },
      ],
    },
    {
      id: "third-parties",
      heading: "Third-party service providers",
      blocks: [
        {
          type: "table",
          caption: "Active or prepared provider categories",
          columns: ["Provider category", "Current role", "Status"],
          rows: [
            [
              "Supabase",
              "Database, Auth, private Storage, Edge Functions, signed URLs, and operational backend functions.",
              "Active",
            ],
            [
              "Cloudflare",
              "Hosting, HTTPS delivery, Pages-style routing, headers, and platform delivery where deployed.",
              "Active or deployment-dependent",
            ],
            [
              "Email provider",
              "Authentication and account email delivery through the configured Auth/email setup.",
              "Provider configuration required",
            ],
            [
              "Turnstile or CAPTCHA",
              "Optional abuse protection for removal requests if a token widget and secret are configured.",
              "Prepared, not always active",
            ],
            [
              "Error monitoring",
              "Sanitized browser error event can be connected to an approved provider.",
              "Not active unless configured",
            ],
            [
              "Payment provider or banking app",
              "Optional support flow may open an external banking or wallet application. Document access is not sold by that support prompt.",
              "Optional, not paid access",
            ],
            [
              "Mobile push provider",
              "Schema and preference groundwork exist, but push delivery is not active.",
              "Future only",
            ],
          ],
        },
      ],
    },
    {
      id: "sharing",
      heading: "Sharing and disclosure",
      blocks: [
        {
          type: "paragraph",
          text: "Personal information is not sold to advertisers. Data may be shared with service providers, authorized moderators and administrators, a user-directed recipient, a successor operator if the Platform is legitimately transferred, or a lawful authority where required by applicable law.",
        },
        {
          type: "paragraph",
          text: "Authorized personnel access should be limited to legitimate operational duties such as moderation, support, security, abuse handling, and legal compliance.",
        },
      ],
    },
    {
      id: "public-information",
      heading: "Public information",
      blocks: [
        {
          type: "paragraph",
          text: "Depending on settings and workflow state, display name, contributor attribution, profile image, resource metadata, publication date, public ratings, public reviews, and published PDF content may become visible to other users or visitors.",
        },
        {
          type: "callout",
          title: "Review every page before uploading",
          text: "PDF content itself may contain personal information supplied by the uploader. Users should not upload private student records, personal identifiers, credentials, private addresses, signatures, or other unnecessary personal data.",
        },
      ],
    },
    {
      id: "students",
      heading: "Children and student users",
      blocks: [
        {
          type: "paragraph",
          text: "The Platform is intended for academic users, but it does not verify the age or legal capacity of every student. Users who are not legally able to agree to these policies independently should use the Platform only with permission and supervision from a parent, guardian, or authorized educational institution, as applicable.",
        },
      ],
    },
    {
      id: "security",
      heading: "Security",
      blocks: [
        {
          type: "list",
          items: [
            "Implemented or prepared controls include managed authentication, provider-handled password hashing, email verification, MFA, role-based permissions, Row Level Security, private Storage, signed URLs, server-side PDF validation, audit logs, security headers, HTTPS, access revocation, and account suspension.",
            "No online service, database, or file-storage system can be guaranteed completely secure.",
            "Responsible security concerns should be sent to the configured contact without posting vulnerability details publicly.",
          ],
        },
      ],
    },
    {
      id: "international-processing",
      heading: "International processing",
      blocks: [
        {
          type: "paragraph",
          text: "Supabase, Cloudflare, email services, monitoring providers, and other vendors may process data outside Nepal depending on their infrastructure and contractual arrangements. The Platform does not claim that all data remains physically in Nepal.",
        },
      ],
    },
    {
      id: "rights-choices",
      heading: "User rights and choices",
      blocks: [
        {
          type: "list",
          items: [
            "Users may access and correct supported profile fields, change notification preferences, remove bookmarks, manage devices, unsubscribe from newsletters, and submit privacy concerns.",
            "Users may request account review, correction, deletion, information about processing, or removal of their own content where permitted.",
            "Requests may be limited by legal obligations, security needs, audit integrity, fraud prevention, copyright disputes, backup cycles, rights of other users, and technical constraints.",
            "The Platform does not currently promise automated data portability for all records.",
          ],
        },
      ],
    },
    {
      id: "account-deletion",
      heading: "Account deletion",
      blocks: [{ type: "paragraph", text: accountDeletionText }],
    },
    {
      id: "breach-response",
      heading: "Incident and breach response",
      blocks: [
        {
          type: "paragraph",
          text: "The operator will investigate suspected security or privacy incidents and take reasonable steps, including user or authority notification where required by applicable law. No fixed notification deadline is promised unless it is legally required and operationally achievable.",
        },
      ],
    },
    {
      id: "changes-contact",
      heading: "Changes and contact",
      blocks: [
        {
          type: "paragraph",
          text: "Policy changes will be published on this page with an updated effective date or last-updated date. Material changes may receive additional notice where appropriate, and new consent may be requested where legally required.",
        },
        {
          type: "paragraph",
          text: contactFormat("Privacy Request - JBC Athenaeum"),
        },
      ],
    },
  ],
};

const terms: PolicyDocument = {
  slug: "terms",
  path: "/terms",
  title: "Terms of Service",
  shortTitle: "Terms",
  summary:
    "Rules for accounts, acceptable use, uploads, academic integrity, moderation, resource availability, optional support, and dispute handling.",
  description:
    "Terms of Service for JBC Athenaeum, including academic-resource use, accounts, uploads, moderation, acceptable use, intellectual property, and Nepal governing law.",
  version: legalConfig.policyVersion,
  effectiveDate: legalConfig.effectiveDate,
  lastUpdated: legalConfig.lastUpdated,
  icon: Scale,
  relatedSlugs: ["privacy", "copyright", "upload", "retention"],
  sections: [
    {
      id: "agreement",
      heading: "Agreement to terms",
      blocks: [
        {
          type: "paragraph",
          text: `By using ${legalConfig.platformName}, you agree to these Terms and the policies incorporated by reference, including the Privacy Policy, Copyright Policy, Upload Policy, and Data Retention Policy.`,
        },
        {
          type: "paragraph",
          text: "Future paid features, if introduced, must be covered by a Payment and Refund Policy before activation. Optional support prompts or coffee donations are not purchases of document access.",
        },
        sharedDefinitions,
        legalContextBlock,
      ],
    },
    {
      id: "eligibility",
      heading: "Eligibility",
      blocks: [
        {
          type: "paragraph",
          text: "You may use the Platform only if you have the legal capacity or appropriate permission to accept these Terms. Students who cannot independently agree should use the Platform with appropriate parent, guardian, or educational supervision.",
        },
      ],
    },
    {
      id: "accounts",
      heading: "Account registration and security",
      blocks: [
        {
          type: "list",
          items: [
            "Provide accurate account and profile information and keep your email account secure.",
            "Do not share passwords, MFA codes, sessions, signed links, or account credentials.",
            "Report suspected unauthorized access promptly.",
            "You are responsible for actions taken through your account unless the issue was outside your reasonable control.",
            "The Platform may suspend or restrict accounts for abuse, security risk, false attribution, rights violations, or policy violations.",
          ],
        },
      ],
    },
    {
      id: "purpose-limitations",
      heading: "Platform purpose and limitations",
      blocks: [
        {
          type: "paragraph",
          text: "JBC Athenaeum provides academic-resource discovery and sharing. Resources are supplemental study materials and may contain errors, become outdated, fail to match current curricula, or reflect a contributor's interpretation.",
        },
        {
          type: "paragraph",
          text: "Moderation may check safety, metadata, relevance, and policy issues, but it does not guarantee academic accuracy, official acceptance, examination results, grades, or institutional approval.",
        },
        {
          type: "callout",
          title: "Independent platform",
          text: independenceText,
        },
      ],
    },
    {
      id: "acceptable-use",
      heading: "Acceptable use",
      blocks: [
        {
          type: "list",
          items: [
            "Do not use the Platform for illegal activity, unauthorized access, privilege escalation, malware, spam, harmful scraping, denial-of-service activity, or security abuse.",
            "Do not upload stolen content, pirated PDFs, confidential records, exam leaks, private student data, false attribution, impersonation, harassment, hate content, threats, or unrelated commercial material.",
            "Do not manipulate download counts, ratings, reports, moderation tools, payment or access controls, or signed resource links.",
            "Legitimate interoperability, good-faith reporting, and responsible security research are not prohibited when conducted lawfully, proportionately, and without exposing user data or disrupting service.",
          ],
        },
      ],
    },
    {
      id: "academic-integrity",
      heading: "Academic integrity",
      blocks: [
        {
          type: "paragraph",
          text: "Resources are for study, revision, and reference. Users remain responsible for complying with campus, faculty, course, and university rules.",
        },
        {
          type: "list",
          items: [
            "Do not submit another person's work as your own.",
            "Do not misrepresent project reports, lab reports, assignments, or practical files.",
            "Do not publish unreleased examination materials obtained improperly.",
            "The Platform may remove materials that facilitate cheating, examination misconduct, or fraudulent academic documents.",
          ],
        },
      ],
    },
    {
      id: "user-content",
      heading: "User content and licence",
      blocks: [
        {
          type: "paragraph",
          text: "Users retain ownership of content they lawfully own. Uploading does not make JBC Athenaeum the owner of every uploaded document.",
        },
        { type: "paragraph", text: operationalLicenseText },
      ],
    },
    {
      id: "platform-ip",
      heading: "Platform intellectual property",
      blocks: [
        {
          type: "paragraph",
          text: `Original platform source code, interface, branding, logo, text, documentation, database organization, graphics, and selection or arrangement of content may belong to ${legalConfig.operatorName} or JBC Athenaeum, except where otherwise indicated.`,
        },
        {
          type: "paragraph",
          text: "Individual uploaded resources, third-party materials, public-domain materials, open-licensed works, and content used with permission remain subject to their respective rights.",
        },
      ],
    },
    {
      id: "availability-moderation",
      heading: "Resource availability and moderation",
      blocks: [
        {
          type: "list",
          items: [
            "The Platform may review, reject, restrict, correct metadata, archive, remove, restore, suspend downloads, replace versions, or limit access to resources.",
            "Automated and manual review may occur. Approval does not certify ownership, legal clearance, accuracy, or academic correctness.",
            "Rejected uploads may remain in limited records for audit, dispute, security, or review purposes.",
            "Administrative decisions may be reviewed through the configured contact process where available.",
          ],
        },
      ],
    },
    {
      id: "third-party-links",
      heading: "Third-party services and links",
      blocks: [
        {
          type: "paragraph",
          text: "Supabase, Cloudflare, email providers, payment or wallet applications, analytics or monitoring providers, and linked websites may have separate terms and policies. JBC Athenaeum is not responsible for third-party availability or conduct except to the extent applicable law requires.",
        },
      ],
    },
    {
      id: "free-paid",
      heading: "Free access, optional support, and future paid features",
      blocks: [
        {
          type: "paragraph",
          text: "Current resource access is not sold through the optional coffee/support prompt. Users may choose to support the creator later or not at all.",
        },
        {
          type: "paragraph",
          text: "If paid 24-hour PDF access or another paid feature is introduced later, the Platform must disclose price, access duration, start of entitlement, payment verification, expiry, re-purchase rules, refund rules, failed-payment handling, payment-provider involvement, access-control restrictions, and the fact that purchase does not transfer ownership.",
        },
      ],
    },
    {
      id: "suspension",
      heading: "Suspension and termination",
      blocks: [
        {
          type: "paragraph",
          text: "Accounts or access may be suspended, restricted, or terminated for user-requested closure, security risk, policy violations, illegal conduct, copyright complaints, repeated abuse, payment fraud if payments are later enabled, or deliberate misuse.",
        },
        { type: "paragraph", text: accountDeletionText },
      ],
    },
    {
      id: "disclaimers-liability",
      heading: "Disclaimers and liability",
      blocks: [
        {
          type: "paragraph",
          text: "The Service is provided on an as-available basis to the maximum extent permitted by applicable law. JBC Athenaeum does not guarantee uninterrupted access, permanent availability, error-free files, safe files despite review, academic advice, legal advice, professional advice, examination performance, or third-party availability.",
        },
        {
          type: "paragraph",
          text: "To the maximum extent permitted by applicable law, JBC Athenaeum and its operator are not liable for indirect, incidental, consequential, special, or punitive losses arising from use of the Platform. Nothing in these Terms excludes liability that cannot legally be excluded or limits mandatory consumer rights.",
        },
      ],
    },
    {
      id: "indemnity",
      heading: "Limited indemnity",
      blocks: [
        {
          type: "paragraph",
          text: "To the extent permitted by law, you are responsible for losses arising from your unlawful uploads, rights violations, deliberate misuse, fraudulent conduct, or material breach of these Terms. This clause is intended to be proportionate and does not remove rights that cannot legally be waived.",
        },
      ],
    },
    {
      id: "law-disputes",
      heading: "Governing law and disputes",
      blocks: [
        {
          type: "paragraph",
          text: "These Terms are governed by the laws of Nepal, subject to mandatory legal rights and jurisdictional requirements. Users are encouraged to contact JBC Athenaeum first for good-faith informal resolution, but nothing prevents a user from approaching a competent authority or court where legally permitted.",
        },
      ],
    },
    {
      id: "changes-contact",
      heading: "Changes and contact",
      blocks: [
        {
          type: "paragraph",
          text: "Material changes to these Terms should be published with reasonable notice where appropriate. Changes are not intended to retroactively remove rights already accrued under applicable law.",
        },
        {
          type: "paragraph",
          text: contactFormat("Legal Request - JBC Athenaeum"),
        },
      ],
    },
  ],
};

const copyright: PolicyDocument = {
  slug: "copyright",
  path: "/copyright",
  title: "Copyright and Intellectual Property Policy",
  shortTitle: "Copyright",
  summary:
    "How JBC Athenaeum treats platform ownership, user ownership, open licences, educational use, prohibited uploads, and copyright-removal requests.",
  description:
    "Copyright and Intellectual Property Policy for JBC Athenaeum, including user ownership, operational licence, prohibited uploads, open licences, and removal-request procedures.",
  version: legalConfig.policyVersion,
  effectiveDate: legalConfig.effectiveDate,
  lastUpdated: legalConfig.lastUpdated,
  icon: FileText,
  relatedSlugs: ["terms", "upload", "privacy", "retention"],
  sections: [
    {
      id: "purpose",
      heading: "Purpose",
      blocks: [
        {
          type: "paragraph",
          text: "JBC Athenaeum respects copyright and expects users to upload only resources they created, are authorized to share, are permitted to distribute under an applicable licence, are lawfully public-domain, or are institutionally authorized for publication.",
        },
        sharedDefinitions,
        legalContextBlock,
      ],
    },
    {
      id: "protected-material",
      heading: "Types of protected material",
      blocks: [
        {
          type: "paragraph",
          text: "Copyright may apply to notes, books, articles, question collections, project reports, assignments, presentation slides, photographs, diagrams, software, database content, audio, video, scanned documents, translations, compilations, and other original works.",
        },
        {
          type: "paragraph",
          text: "Copyright does not necessarily protect every fact, idea, method, official course name, or general data point merely because it appears in a file. The Platform does not give individualized legal advice about a particular work.",
        },
      ],
    },
    {
      id: "ownership-categories",
      heading: "Ownership categories",
      blocks: [
        {
          type: "list",
          items: [
            "Uploader-created original work.",
            "Content used with permission.",
            "Open-licensed content with licence details preserved.",
            "Public-domain content supported by evidence.",
            "Institutionally authorized content.",
            "Third-party content pending verification.",
          ],
        },
        {
          type: "paragraph",
          text: "Do not label content public domain without evidence, and do not remove licence, author, or source information from open-licensed material.",
        },
      ],
    },
    {
      id: "platform-ownership",
      heading: "Platform ownership",
      blocks: [
        {
          type: "paragraph",
          text: `Copyright (c) ${legalConfig.firstPublicationYear}-${legalConfig.currentYear} ${legalConfig.operatorName} / ${legalConfig.platformName}. All rights reserved, except where otherwise indicated.`,
        },
        {
          type: "paragraph",
          text: "This notice applies to original platform components and does not automatically apply to every uploaded resource or third-party material.",
        },
      ],
    },
    {
      id: "user-ownership-licence",
      heading: "User ownership and operational licence",
      blocks: [
        {
          type: "paragraph",
          text: "Uploaders retain rights they lawfully possess. Submission does not transfer ownership to JBC Athenaeum.",
        },
        { type: "paragraph", text: operationalLicenseText },
      ],
    },
    {
      id: "educational-use",
      heading: "Educational use is not automatic permission",
      blocks: [
        {
          type: "list",
          items: [
            "An educational purpose does not automatically remove copyright restrictions.",
            "Giving credit alone does not always authorize copying or redistribution.",
            "Material available online is not necessarily free to upload elsewhere.",
            "Buying a book or document does not automatically grant upload rights.",
            "Campus circulation does not automatically permit public internet distribution.",
          ],
        },
      ],
    },
    {
      id: "open-licences",
      heading: "Open licences",
      blocks: [
        {
          type: "paragraph",
          text: "Open licences such as Creative Commons may allow sharing only if the licence conditions are followed. Those conditions may include attribution, source link, author name, licence version, non-commercial limits, no-derivatives limits, and share-alike obligations.",
        },
        {
          type: "paragraph",
          text: "JBC Athenaeum does not relicense third-party material. Uploaders must preserve licence information and source details where practical.",
        },
      ],
    },
    {
      id: "prohibited-uploads",
      heading: "Prohibited copyright uploads",
      blocks: [
        {
          type: "list",
          items: [
            "Full commercial textbooks, paid course packs, pirated PDFs, leaked publications, subscription-only resources, unauthorized scanned books, and copyrighted answer guides without permission.",
            "Files with removed watermarks, content copied from another platform without permission, another student's work presented as original, or institutional documents marked confidential.",
            "Material previously removed for rights reasons unless the issue has been resolved and the uploader has authority to resubmit.",
          ],
        },
      ],
    },
    {
      id: "complaints",
      heading: "Copyright Removal Request",
      blocks: [
        {
          type: "paragraph",
          text: "A copyright complaint should identify the complainant, contact information, protected work, allegedly infringing resource, explanation of rights, good-faith concern, accuracy statement, authority to act, electronic or physical signature where appropriate, and supporting evidence.",
        },
        {
          type: "paragraph",
          text: contactFormat("Copyright Removal Request - [Resource Title]"),
        },
        {
          type: "paragraph",
          text: "This process is a copyright-removal process under the Platform's policies. It is not labelled as a U.S. DMCA process.",
        },
      ],
    },
    {
      id: "initial-action",
      heading: "Initial action and review",
      blocks: [
        {
          type: "list",
          items: [
            "JBC Athenaeum may temporarily restrict access, preserve evidence, notify the uploader, request additional information, remove or restore content, record the decision, and restrict repeat infringers where appropriate.",
            "The uploader may provide ownership evidence, permission, licence information, public-domain evidence, context, consent documentation, or a correction proposal.",
            "No fixed decision time is promised unless an approved operational process later sets one.",
          ],
        },
      ],
    },
    {
      id: "repeat-infringement",
      heading: "Repeat infringement",
      blocks: [
        {
          type: "paragraph",
          text: "Repeated or serious rights violations may result in warnings, upload restrictions, contributor-role removal, account suspension, account termination, and preservation of records required for disputes or legal obligations.",
        },
      ],
    },
    {
      id: "database-trademarks",
      heading: "Database rights, compilations, and names",
      blocks: [
        {
          type: "paragraph",
          text: "The Platform's taxonomy, metadata compilation, selection, arrangement, and original database organization may be protected to the extent recognized by applicable law. JBC Athenaeum does not claim ownership over underlying facts, course names, public syllabus facts, or third-party materials merely because they appear in the database.",
        },
        {
          type: "paragraph",
          text: "Tribhuvan University, Jana Bhawana Campus, faculties, payment providers, technology providers, and other names or marks remain property of their respective owners. Use is descriptive unless authorization is expressly stated.",
        },
      ],
    },
  ],
};

const upload: PolicyDocument = {
  slug: "upload",
  path: "/policies/upload",
  title: "Upload and Contribution Policy",
  shortTitle: "Upload Policy",
  summary:
    "Rules for contributor eligibility, PDF-only uploads, ownership declarations, prohibited content, moderation, quarantine, versioning, and enforcement.",
  description:
    "Upload and Contribution Policy for JBC Athenaeum, covering contributor roles, PDF validation, prohibited personal data and credentials, review, licensing, attribution, and resubmissions.",
  version: legalConfig.policyVersion,
  effectiveDate: legalConfig.effectiveDate,
  lastUpdated: legalConfig.lastUpdated,
  icon: BookOpenCheck,
  relatedSlugs: ["terms", "copyright", "privacy", "retention"],
  sections: [
    {
      id: "purpose",
      heading: "Purpose",
      blocks: [
        {
          type: "paragraph",
          text: "This policy explains what users may contribute, how upload validation works, how moderation happens, and what declarations uploaders make before submitting a resource.",
        },
        sharedDefinitions,
        legalContextBlock,
      ],
    },
    {
      id: "eligibility",
      heading: "Eligibility to upload",
      blocks: [
        {
          type: "paragraph",
          text: "The trusted upload pipeline requires an authenticated, active, email-verified account. Server-side permission checks are designed for users with contributor, faculty, moderator, admin, or super_admin privileges where those roles are granted.",
        },
        {
          type: "paragraph",
          text: "Administrative role labels shown in the interface do not override database authorization rules or server-side checks.",
        },
      ],
    },
    {
      id: "declaration",
      heading: "Ownership and authorization declaration",
      blocks: [
        {
          type: "paragraph",
          text: "Before upload, contributors must confirm that they created the material, have permission to share it, the licence allows distribution, it is lawfully public-domain, or an institution authorized publication.",
        },
        {
          type: "paragraph",
          text: "The upload checkbox records the user, submission, policy slug, policy version, and acceptance timestamp where the latest database migration is deployed. A checkbox is not proof of ownership, but it creates an auditable declaration.",
        },
      ],
    },
    {
      id: "accepted-content",
      heading: "Accepted content",
      blocks: [
        {
          type: "list",
          items: [
            "Original notes, lab reports, project templates, project reports, assignments, practical files, diagrams, and presentation materials.",
            "Past questions lawfully shared, syllabus documents authorized for distribution, open educational resources, institutionally approved resources, and corrected or updated academic resources.",
            "Metadata should match the existing campus, faculty, program, term, subject, category, and academic year taxonomy.",
          ],
        },
      ],
    },
    {
      id: "prohibited-content",
      heading: "Prohibited content",
      blocks: [
        {
          type: "list",
          items: [
            "Pirated books, malware, executable payloads, password theft tools, illegal content, examination leaks, fraudulent academic documents, misleading altered results, and copyright-infringing content.",
            "Personally identifying student records, marksheets without authorization, medical information, government identifiers, financial credentials, passwords, private email threads, confidential campus documents, harassment, hate content, sexual exploitation material, violent threats, advertisements, spam, and unrelated commercial material.",
            "Files designed to bypass platform security, abuse validation, conceal executable content, or mislead moderators.",
          ],
        },
      ],
    },
    {
      id: "personal-data",
      heading: "Personal information in documents",
      blocks: [
        {
          type: "paragraph",
          text: "Uploaders must check every page and remove unnecessary personal information before upload.",
        },
        {
          type: "list",
          items: [
            "Remove or redact phone numbers, personal email addresses, home addresses, registration identifiers, citizenship numbers, banking details, signatures, private photographs, health information, passwords, API keys, database credentials, private URLs, and access tokens.",
            "Do not rely on moderators to find every hidden detail inside a PDF.",
          ],
        },
      ],
    },
    {
      id: "credential-safety",
      heading: "Database and credential safety",
      blocks: [
        {
          type: "paragraph",
          text: "Academic project archives often contain sensitive configuration files. The current pipeline accepts PDFs only, but contributors must still make sure screenshots, appendices, or embedded text do not expose secrets.",
        },
        {
          type: "list",
          items: [
            "Do not upload .env files, database backups, SQL dumps with credentials, service-role keys, Supabase secret keys, SMTP passwords, API tokens, private SSH keys, cloud credentials, production configuration archives, session cookies, authentication exports, user tables, password hashes, or unredacted audit logs.",
            "If archive uploads are ever introduced, users must inspect ZIP or archive contents before upload and the policy must be updated.",
          ],
        },
      ],
    },
    {
      id: "file-types",
      heading: "Supported file types and validation",
      blocks: [
        {
          type: "table",
          caption: "Current upload limits",
          columns: ["Requirement", "Current value"],
          rows: [
            ["File type", uploadLimits.currentFileTypes],
            ["Maximum file size", uploadLimits.maxMegabytesLabel],
            ["MIME and extension", "application/pdf and .pdf are required."],
            [
              "Page count",
              `PDF must contain at least one page and no more than ${uploadLimits.maxPagesLabel}.`,
            ],
            [
              "Encrypted PDFs",
              "Password-protected or encrypted PDFs are rejected.",
            ],
            [
              "Unsafe PDF features",
              "Embedded files, active actions, launch actions, rich media, submit forms, and JavaScript-like PDF features are rejected.",
            ],
            ["Upload session", uploadLimits.uploadSessionLabel],
          ],
        },
      ],
    },
    {
      id: "metadata",
      heading: "File names and metadata",
      blocks: [
        {
          type: "paragraph",
          text: "Resource title, subject, program, semester or term, category, academic year, author or contributor, source, licence, description, and language should be accurate. Misleading titles, false attribution, and keyword spam may be corrected or rejected.",
        },
      ],
    },
    {
      id: "review-quarantine",
      heading: "Review and quarantine",
      blocks: [
        {
          type: "paragraph",
          text: "The current workflow is: upload, temporary or quarantine Storage, automated validation, moderator review, changes requested, rejection or approval, and publication where authorized.",
        },
        {
          type: "list",
          items: [
            "Upload does not guarantee publication.",
            "Files may remain private during review.",
            "Moderators may correct metadata, request a replacement, reject a file, or approve publication.",
            "Rejection reasons and review records may be retained for audit or dispute handling.",
            "Approval is not legal certification or academic accuracy certification.",
          ],
        },
      ],
    },
    {
      id: "technical-processing",
      heading: "Technical processing",
      blocks: [
        {
          type: "list",
          items: [
            "The Platform may calculate checksums, inspect MIME types, parse PDF structure, read PDF metadata, detect page count, generate previews or thumbnails where implemented, store versions, rename files internally, use generated storage paths, and record upload activity.",
            "The current validation detects several unsafe PDF features, but the public repository does not prove a full antivirus scanning service is active.",
          ],
        },
      ],
    },
    {
      id: "licence-attribution",
      heading: "Licence and attribution",
      blocks: [
        { type: "paragraph", text: operationalLicenseText },
        {
          type: "paragraph",
          text: "Contributor attribution may use full name, display name, institution attribution, original-source attribution, or limited attribution where supported. Administrative records may still retain account identity even if public attribution is changed.",
        },
      ],
    },
    {
      id: "versions-removal",
      heading: "Versioning, corrections, and removal",
      blocks: [
        {
          type: "paragraph",
          text: "New versions may be submitted, old versions may be archived, version history may remain, and published URLs may point to the current approved version. Material changes may require renewed review.",
        },
        {
          type: "paragraph",
          text: "Contributors may request removal, but removal may be delayed or limited by copyright disputes, institutional records, legal requirements, audit needs, existing reports, backup cycles, published derivative metadata, and platform integrity.",
        },
      ],
    },
    {
      id: "enforcement-appeals",
      heading: "Enforcement and appeals",
      blocks: [
        {
          type: "paragraph",
          text: "Possible consequences include warning, correction request, rejection, removal, upload suspension, contributor-role removal, account suspension, account termination, or legal referral where required.",
        },
        {
          type: "paragraph",
          text: "A contributor may request review of a decision through the configured contact. Review does not guarantee reversal.",
        },
      ],
    },
  ],
};

const retentionRows = [
  [
    "Active account data",
    "Profile, roles, preferences",
    "Account active",
    retentionConfig.activeAccountData,
    "Account deletion workflow",
  ],
  [
    "Authentication data",
    "Sessions, MFA records",
    "Expiry or revocation",
    retentionConfig.authenticationData,
    "Provider deletion or revocation",
  ],
  [
    "Published resources",
    "Approved PDFs and metadata",
    "Removal or archive decision",
    retentionConfig.publishedResources,
    "Unpublish, delete, or archive",
  ],
  [
    "Rejected uploads",
    "Quarantine file and reason",
    "Rejection",
    retentionConfig.rejectedUploads,
    "Deletion job or restricted archive",
  ],
  [
    "Temporary uploads",
    "Incomplete upload sessions",
    "Session expiration",
    retentionConfig.temporaryUploads,
    "Automated cleanup",
  ],
  [
    "Resource versions",
    "Historical PDFs and metadata",
    "Superseded version",
    retentionConfig.resourceVersions,
    "Archive or deletion",
  ],
  [
    "Download events",
    "Resource and timestamp",
    "Event creation",
    retentionConfig.downloadEvents,
    "Delete, anonymize, or aggregate",
  ],
  [
    "Anonymous analytics",
    "Aggregated usage",
    "Aggregation",
    retentionConfig.anonymousAnalytics,
    "Aggregate or delete raw events",
  ],
  [
    "Bookmarks",
    "User-resource relation",
    "User removal or account deletion",
    retentionConfig.bookmarks,
    "Database deletion",
  ],
  [
    "Ratings and reviews",
    "Rating and optional text",
    "User deletion or moderation",
    retentionConfig.ratings,
    "Delete, hide, or anonymize",
  ],
  [
    "Notifications",
    "In-app messages",
    "Read or expired",
    retentionConfig.notifications,
    "Scheduled deletion",
  ],
  [
    "Audit records",
    "Role and moderation actions",
    "Event creation",
    retentionConfig.auditRecords,
    "Restricted expiry",
  ],
  [
    "Reports",
    "Abuse and copyright reports",
    "Resolution",
    retentionConfig.reports,
    "Restricted deletion after dispute review",
  ],
  [
    "Support messages",
    "Correspondence",
    "Case closure",
    retentionConfig.supportMessages,
    "Scheduled deletion",
  ],
  [
    "Newsletter records",
    "Email and consent",
    "Unsubscribe",
    retentionConfig.newsletterRecords,
    "Delete or minimal suppression",
  ],
  [
    "Device records",
    "Platform, token, version",
    "Logout or token expiry",
    retentionConfig.deviceRecords,
    "Revoke or delete",
  ],
  [
    "Payment records",
    "Order and transaction references",
    "Transaction date",
    retentionConfig.paymentRecords,
    "Restricted archive if enabled",
  ],
  [
    "Backups",
    "Database and Storage snapshots",
    "Backup creation",
    retentionConfig.backups,
    "Provider or approved rotation",
  ],
  [
    "Security logs",
    "IP, user agent, failed access",
    "Event date",
    retentionConfig.securityLogs,
    "Scheduled deletion",
  ],
  [
    "Account-deletion requests",
    "Identity and request evidence",
    "Completion",
    retentionConfig.accountDeletionProof,
    "Restricted archive",
  ],
];

const retention: PolicyDocument = {
  slug: "retention",
  path: "/policies/retention",
  title: "Data Retention and Deletion Policy",
  shortTitle: "Data Retention",
  summary:
    "How JBC Athenaeum retains, deletes, anonymizes, archives, and backs up account, resource, upload, audit, report, and operational records.",
  description:
    "Data Retention and Deletion Policy for JBC Athenaeum, including account data, uploads, Storage files, audit records, reports, backups, and deletion workflows.",
  version: legalConfig.policyVersion,
  effectiveDate: legalConfig.effectiveDate,
  lastUpdated: legalConfig.lastUpdated,
  icon: Database,
  relatedSlugs: ["privacy", "terms", "upload", "copyright"],
  sections: [
    {
      id: "purpose",
      heading: "Purpose",
      blocks: [
        {
          type: "paragraph",
          text: "This policy explains why JBC Athenaeum retains data and how deletion, anonymization, archive, and backup handling work at a user-facing and database level.",
        },
        sharedDefinitions,
        legalContextBlock,
      ],
    },
    {
      id: "principles",
      heading: "Retention principles",
      blocks: [
        {
          type: "list",
          items: [
            "Collect and retain only what is needed for academic resource access, moderation, account security, legal handling, operational reliability, audit integrity, and platform improvement.",
            "Delete, anonymize, aggregate, restrict, or archive records when the original purpose no longer applies and no legal, security, dispute, or operational reason requires retention.",
            "Do not promise immediate deletion from every backup or log system.",
            "Final retention periods require administrator and legal approval unless already verified in the codebase or operational documentation.",
          ],
        },
      ],
    },
    {
      id: "schedule",
      heading: "Retention schedule",
      blocks: [
        {
          type: "table",
          caption: "Public retention schedule",
          columns: [
            "Data category",
            "Examples",
            "Retention trigger",
            "Proposed retention",
            "Deletion method",
          ],
          rows: retentionRows,
        },
      ],
    },
    {
      id: "database-records",
      heading: "Database records",
      blocks: [
        {
          type: "paragraph",
          text: "Deletion may involve profiles, user roles, bookmarks, ratings, notifications, devices, submissions, upload sessions, reports, download events, audit events, feedback, newsletter subscriptions, payment records if introduced, and deletion jobs.",
        },
        {
          type: "paragraph",
          text: "Depending on the record, the Platform may use cascade deletion, nulling user references, anonymization, restricted records, soft deletion, hard deletion, or archival. SQL implementation details are not published in this public policy.",
        },
      ],
    },
    {
      id: "storage-files",
      heading: "Storage files",
      blocks: [
        {
          type: "paragraph",
          text: "Temporary uploads, quarantine files, published files, preview images, thumbnails, profile images, superseded versions, and orphan files may require separate Storage cleanup. Deleting a database row and deleting a Storage object are separate operations.",
        },
      ],
    },
    {
      id: "account-deletion",
      heading: "Account deletion workflow",
      blocks: [
        {
          type: "paragraph",
          text: "The expected workflow is: request, identity verification, account restriction where appropriate, review for legal or security holds, deletion or anonymization, Storage cleanup, backup expiration, and completion notice where feasible.",
        },
        { type: "paragraph", text: accountDeletionText },
      ],
    },
    {
      id: "published-content",
      heading: "Published contributor content",
      blocks: [
        {
          type: "paragraph",
          text: "When an account is deleted, published resources are not silently kept with personal attribution forever. They may be removed, retained with attribution removed, or retained under the licence previously granted after a review of the contributor's request, legal rights, public-interest considerations, institutional authorization, and unresolved disputes.",
        },
      ],
    },
    {
      id: "anonymization",
      heading: "Anonymization and aggregation",
      blocks: [
        {
          type: "paragraph",
          text: "Certain records may be retained after removing direct account identifiers, such as aggregate download counts, aggregate rating statistics, anonymous audit metrics, or published resource statistics. Data should not be described as anonymous if it can still reasonably identify a person.",
        },
      ],
    },
    {
      id: "holds-backups",
      heading: "Legal holds, security holds, and backups",
      blocks: [
        {
          type: "paragraph",
          text: "Deletion may be paused for legal proceedings, copyright disputes, fraud investigations, security incidents, government orders, payment disputes if payments are introduced, and policy enforcement. Holds should be limited to what is necessary.",
        },
        {
          type: "paragraph",
          text: "Backups may contain deleted data until rotation. Backups are restricted and should not restore deleted data into active use except for legitimate disaster recovery. Restored systems should reapply deletion requests where technically feasible.",
        },
      ],
    },
    {
      id: "automated-jobs",
      heading: "Automated deletion jobs",
      blocks: [
        {
          type: "paragraph",
          text: "Automated cleanup jobs may identify expired upload sessions, quarantine files, notifications, signed-access records, device tokens, temporary previews, failed uploads, and private Storage cleanup work. The public policy does not promise a fixed job interval unless the interval is operationally approved.",
        },
      ],
    },
    {
      id: "changes-contact",
      heading: "Retention changes and contact",
      blocks: [
        {
          type: "paragraph",
          text: "Retention schedules may change because of legal obligations, security needs, new platform features, payment integration, mobile applications, provider changes, or institutional decisions. Material changes require policy updates.",
        },
        {
          type: "paragraph",
          text: contactFormat(
            "Data Retention or Deletion Request - JBC Athenaeum",
          ),
        },
      ],
    },
  ],
};

const compactPolicy = (
  slug: PolicySlug,
  path: string,
  title: string,
  shortTitle: string,
  summary: string,
  sections: PolicyDocument["sections"],
): PolicyDocument => ({
  slug,
  path,
  title,
  shortTitle,
  summary,
  description: summary,
  version: legalConfig.policyVersion,
  effectiveDate: legalConfig.effectiveDate,
  lastUpdated: legalConfig.lastUpdated,
  relatedSlugs: ["terms", "privacy", "copyright", "upload"],
  sections,
});

export const policyDocuments: PolicyDocument[] = [
  privacy,
  terms,
  copyright,
  upload,
  retention,
  compactPolicy(
    "content-removal",
    "/policies/content-removal",
    "Content Removal Policy",
    "Content Removal",
    "How users and affected parties can request review or removal of content.",
    [
      {
        id: "requests",
        heading: "Requests",
        blocks: [
          {
            type: "paragraph",
            text: "A requester should identify the resource, their relationship to it, the concern, relevant evidence, and a working contact address.",
          },
          {
            type: "paragraph",
            text: contactFormat("Content Removal Request - JBC Athenaeum"),
          },
        ],
      },
      {
        id: "handling",
        heading: "Handling",
        blocks: [
          {
            type: "paragraph",
            text: "Authorized staff may restrict access while investigating, preserve an audit record, request more information, resolve the request, dismiss it, or remove content where justified.",
          },
        ],
      },
    ],
  ),
  compactPolicy(
    "acceptable-use",
    "/policies/acceptable-use",
    "Acceptable Use Policy",
    "Acceptable Use",
    "Baseline conduct rules for using JBC Athenaeum without abusing users, resources, or infrastructure.",
    [
      {
        id: "expected-conduct",
        heading: "Expected conduct",
        blocks: [
          {
            type: "paragraph",
            text: "Use accurate identity information, protect account credentials, respect academic integrity, and interact with the Platform in a lawful and proportionate way.",
          },
        ],
      },
      {
        id: "prohibited-conduct",
        heading: "Prohibited conduct",
        blocks: [
          {
            type: "paragraph",
            text: "Do not attempt privilege escalation, disrupt service, distribute malware, scrape private data, abuse reports, manipulate ratings or downloads, or upload unlawful or rights-infringing material.",
          },
        ],
      },
    ],
  ),
  compactPolicy(
    "account-deletion",
    "/policies/account-deletion",
    "Account Deletion Policy",
    "Account Deletion",
    "How account deletion requests are reviewed against security, audit, copyright, and retention obligations.",
    [
      {
        id: "workflow",
        heading: "Workflow",
        blocks: [
          { type: "paragraph", text: accountDeletionText },
          {
            type: "paragraph",
            text: contactFormat("Account Deletion Request - JBC Athenaeum"),
          },
        ],
      },
    ],
  ),
  compactPolicy(
    "reporting",
    "/policies/reporting",
    "Resource Reporting Policy",
    "Resource Reporting",
    "How authenticated reports about published resources are submitted and reviewed.",
    [
      {
        id: "reports",
        heading: "Reports",
        blocks: [
          {
            type: "paragraph",
            text: "Authenticated users may report published resources with a reason and optional details. Authorized staff investigate, document a resolution, and may archive content where justified.",
          },
        ],
      },
    ],
  ),
];

export const primaryPolicySlugs: PolicySlug[] = [
  "privacy",
  "terms",
  "copyright",
  "upload",
  "retention",
];

export const policyByPath = new Map(
  policyDocuments.map((policy) => [policy.path, policy]),
);

export const policyBySlug = new Map(
  policyDocuments.map((policy) => [policy.slug, policy]),
);

export function getPolicyBySlug(slug: PolicySlug) {
  const policy = policyBySlug.get(slug);
  if (!policy) throw new Error(`Policy not found: ${slug}`);
  return policy;
}

export { retentionRows };
