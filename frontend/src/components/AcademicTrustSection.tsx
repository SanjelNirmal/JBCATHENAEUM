import { Link } from "react-router-dom";

const reviewSteps = [
  "Student or faculty submits a resource.",
  "The moderation team checks file safety and relevance.",
  "Academic metadata is verified.",
  "Approved resources are published.",
  "Reports and corrections remain available after publication.",
];

const trustLinks = [
  ["About", "/about"],
  ["Upload policy", "/policies/upload"],
  ["Copyright policy", "/copyright"],
  ["Report resource", "/policies/reporting"],
  ["Contact", "/about"],
] as const;

export function AcademicTrustSection({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="trust-section-heading"
      className={`rounded-2xl border border-slate-200 bg-white p-6 ${compact ? "" : "mt-12 sm:p-8"}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#85591f]">
        Trust and moderation
      </p>
      <h2
        id="trust-section-heading"
        className="mt-2 font-serif text-3xl font-bold text-[#002147]"
      >
        How resources are reviewed
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        JBC Athenaeum is managed by a student moderation team with reviewer and
        faculty support. “Reviewed” means a moderator checked safety and
        relevance. “Faculty Verified” appears only when a faculty reviewer is
        explicitly recorded in the database.
      </p>
      <ol className="mt-6 space-y-3 text-sm text-slate-700">
        {reviewSteps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#002147] text-xs font-bold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm text-slate-600">
        Moderation reduces risk but cannot guarantee zero inaccuracies in every
        student-contributed file.
      </p>
      <nav aria-label="Trust policy links" className="mt-5 flex flex-wrap gap-3">
        {trustLinks.map(([label, to]) => (
          <Link
            key={to}
            to={to}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#002147]"
          >
            {label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
