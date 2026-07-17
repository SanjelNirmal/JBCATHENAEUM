import { AlertTriangle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Seo } from "../components/Seo";

const policies: Record<
  string,
  { title: string; summary: string; sections: Array<[string, string]> }
> = {
  "/privacy": {
    title: "Privacy Policy",
    summary:
      "Draft for institutional review. It describes the data the proposed service is designed to process; it does not claim campus approval.",
    sections: [
      [
        "Data processed",
        "Account identifiers, profile fields, submission metadata, moderation records, reports, and operational security records may be processed to operate the archive.",
      ],
      [
        "Access and disclosure",
        "Access is restricted by role and Row Level Security. Campus leadership must approve retention periods, lawful bases, contact points, and any third-party processors before launch.",
      ],
      [
        "Your choices",
        "Users may request correction or account review through the institutionally approved contact channel once designated.",
      ],
    ],
  },
  "/terms": {
    title: "Terms of Use",
    summary: "Draft for campus legal and administrative approval.",
    sections: [
      [
        "Permitted use",
        "Use the archive for legitimate academic study and campus activities.",
      ],
      [
        "User responsibility",
        "Users are responsible for the accuracy, ownership, and appropriateness of material they submit.",
      ],
      [
        "Moderation",
        "Submissions may be reviewed, rejected, archived, or removed under approved campus governance procedures.",
      ],
    ],
  },
  "/copyright": {
    title: "Copyright Policy",
    summary:
      "Draft guidance; final rules and designated copyright contact require institutional approval.",
    sections: [
      [
        "Uploads",
        "Upload only material you created, are authorized to share, or may lawfully distribute.",
      ],
      [
        "Restricted material",
        "Do not upload commercial textbooks, paywalled works, confidential records, or material that infringes another party's rights.",
      ],
      [
        "Removal requests",
        "Rights holders and affected parties can use the structured removal-request form. Submission does not predetermine the outcome.",
      ],
    ],
  },
  "/policies/upload": {
    title: "Upload Policy",
    summary: "Operational draft pending campus approval.",
    sections: [
      [
        "Format",
        "The initial release accepts PDF files up to the configured limit, currently 25 MB.",
      ],
      [
        "Safety",
        "Encrypted, malformed, duplicate, embedded-file, and active-content PDFs are rejected by automated checks.",
      ],
      [
        "Review",
        "Passing automated validation does not guarantee publication. A moderator reviews academic relevance and metadata.",
      ],
    ],
  },
  "/policies/content-removal": {
    title: "Content Removal Policy",
    summary:
      "Draft process pending institutional ownership and response-time approval.",
    sections: [
      [
        "Requests",
        "A requester should identify the resource, their relationship to it, the concern, and relevant evidence.",
      ],
      [
        "Assessment",
        "Authorized staff review requests, preserve an audit record, and may restrict access while investigating.",
      ],
      [
        "Outcomes",
        "A request may be resolved or dismissed with an internal decision note. Legal escalation procedures require campus approval.",
      ],
    ],
  },
  "/policies/acceptable-use": {
    title: "Acceptable Use Policy",
    summary: "Draft for institutional review.",
    sections: [
      [
        "Expected conduct",
        "Use accurate identity information, protect account credentials, and interact respectfully.",
      ],
      [
        "Prohibited conduct",
        "Do not attempt privilege escalation, disrupt service, distribute malware, scrape private data, or abuse reporting and upload systems.",
      ],
    ],
  },
  "/policies/account-deletion": {
    title: "Account Deletion Policy",
    summary:
      "Draft; authentication-account deletion requires an approved administrative process.",
    sections: [
      [
        "Suspension versus deletion",
        "Suspending a profile does not delete its Supabase Authentication account.",
      ],
      [
        "Requests",
        "Account deletion requests require identity verification and an assessment of audit, moderation, and legal retention obligations.",
      ],
      [
        "Anonymization",
        "Campus leadership must decide when contribution attribution may be anonymized while preserving required audit integrity.",
      ],
    ],
  },
  "/policies/retention": {
    title: "Data Retention Policy",
    summary: "Proposed technical baseline requiring campus approval.",
    sections: [
      [
        "Soft deletion",
        "Resources are archived by default. The implementation prevents permanent resource deletion until at least 90 days after archival.",
      ],
      [
        "Operational records",
        "Final retention periods for audit events, reports, account records, and backups must be approved and configured by the institution.",
      ],
      [
        "Review",
        "Retention settings should be reviewed annually and after legal or operational changes.",
      ],
    ],
  },
  "/policies/reporting": {
    title: "Resource Reporting Policy",
    summary: "Draft moderation process pending campus approval.",
    sections: [
      [
        "Who may report",
        "Authenticated users may report published resources with a reason and optional details.",
      ],
      [
        "Handling",
        "Authorized staff investigate, document a resolution, and may archive content where justified.",
      ],
      [
        "Misuse",
        "Repeated knowingly false or abusive reports may be handled under the acceptable-use process.",
      ],
    ],
  },
};

export default function PolicyPage() {
  const location = useLocation();
  const policy = policies[location.pathname] ?? policies["/terms"];
  return (
    <main id="main-content" className="mx-auto max-w-4xl px-5 py-16">
      <Seo
        title={policy.title}
        description={policy.summary}
        path={location.pathname}
      />
      <p className="text-sm font-bold uppercase tracking-wider text-[#85591f]">
        Governance document
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-[#002147]">
        {policy.title}
      </h1>
      <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="shrink-0" size={20} />
        <p>{policy.summary}</p>
      </div>
      <div className="mt-9 space-y-8">
        {policy.sections.map(([title, body]) => (
          <section key={title}>
            <h2 className="font-serif text-2xl font-bold text-[#002147]">
              {title}
            </h2>
            <p className="mt-3 leading-7 text-slate-700">{body}</p>
          </section>
        ))}
      </div>
      <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
        Document status: draft · Institutional owner, approval date, review
        date, and official contact are not yet assigned.
      </p>
    </main>
  );
}
