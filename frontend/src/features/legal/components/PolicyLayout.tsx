import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../../../components/Seo";
import { legalConfig } from "../config/legalConfig";
import { getPolicyBySlug } from "../content/policies";
import type { PolicyBlock, PolicyDocument } from "../types";

function readableDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function PolicyDates({ policy }: { policy: PolicyDocument }) {
  return (
    <dl className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
      <div>
        <dt className="font-bold uppercase tracking-wider text-slate-500">
          Version
        </dt>
        <dd className="mt-1 text-slate-900">{policy.version}</dd>
      </div>
      <div>
        <dt className="font-bold uppercase tracking-wider text-slate-500">
          Effective
        </dt>
        <dd className="mt-1 text-slate-900">
          <time dateTime={policy.effectiveDate}>
            {readableDate(policy.effectiveDate)}
          </time>
        </dd>
      </div>
      <div>
        <dt className="font-bold uppercase tracking-wider text-slate-500">
          Last updated
        </dt>
        <dd className="mt-1 text-slate-900">
          <time dateTime={policy.lastUpdated}>
            {readableDate(policy.lastUpdated)}
          </time>
        </dd>
      </div>
    </dl>
  );
}

function PrintPolicyButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="Print policy"
      className="policy-print-hidden inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#c49b63] bg-white px-4 text-sm font-bold text-[#002147] shadow-sm transition hover:bg-amber-50"
    >
      <Printer aria-hidden="true" size={17} />
      Print policy
    </button>
  );
}

function TableOfContents({ policy }: { policy: PolicyDocument }) {
  return (
    <nav
      aria-label={`${policy.title} table of contents`}
      className="policy-print-hidden mt-10 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="font-serif text-xl font-bold text-[#002147]">
        Table of contents
      </h2>
      <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {policy.sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-9 items-center rounded px-2 font-semibold text-slate-700 hover:text-[#85591f] hover:underline focus-visible:outline-2"
            >
              {index + 1}. {section.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function renderBlock(block: PolicyBlock, index: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={index} className="mt-4 leading-8 text-slate-700">
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul
          key={index}
          className="mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-700"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <aside
          key={index}
          className="mt-5 rounded-lg border-l-4 border-[#c49b63] bg-amber-50 p-4 text-slate-800"
        >
          <p className="font-bold text-[#002147]">{block.title}</p>
          <p className="mt-2 leading-7">{block.text}</p>
        </aside>
      );
    case "definitions":
      return (
        <dl
          key={index}
          className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          {block.terms.map((item) => (
            <div key={item.term}>
              <dt className="font-bold text-[#002147]">{item.term}</dt>
              <dd className="mt-1 leading-7 text-slate-700">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        <div key={index} className="mt-5 overflow-x-auto">
          <table className="min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">{block.caption}</caption>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border border-slate-300 bg-[#002147] px-3 py-3 font-bold text-white"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr
                  key={row.join("|")}
                  className="odd:bg-white even:bg-slate-50"
                >
                  {row.map((cell) => (
                    <td
                      key={cell}
                      className="border border-slate-300 px-3 py-3 align-top leading-6 text-slate-700"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function RelatedPolicies({ policy }: { policy: PolicyDocument }) {
  return (
    <section className="policy-print-hidden mt-12 border-t border-slate-200 pt-8">
      <h2 className="font-serif text-2xl font-bold text-[#002147]">
        Related policies
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {policy.relatedSlugs.map((slug) => {
          const related = getPolicyBySlug(slug);
          return (
            <Link
              key={slug}
              to={related.path}
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:border-[#c49b63] hover:text-[#002147]"
            >
              {related.shortTitle}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function PolicyLayout({ policy }: { policy: PolicyDocument }) {
  const Icon = policy.icon;
  return (
    <main
      id="main-content"
      className="site-policy-shell mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16"
    >
      <Seo
        title={policy.title}
        description={policy.description}
        path={policy.path}
      />
      <div className="policy-print-hidden mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/policies"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-[#002147] hover:underline"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Back to Policies
        </Link>
        <PrintPolicyButton />
      </div>
      <article className="rounded-lg border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8 lg:px-12">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#85591f]">
            {legalConfig.platformName} policy
          </p>
          <div className="mt-4 flex items-start gap-4">
            {Icon && (
              <Icon
                aria-hidden="true"
                className="mt-2 hidden shrink-0 text-[#c49b63] sm:block"
                size={34}
              />
            )}
            <div>
              <h1 className="font-serif text-4xl font-black leading-tight text-[#002147] sm:text-5xl">
                {policy.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                {policy.summary}
              </p>
            </div>
          </div>
          <PolicyDates policy={policy} />
        </header>
        <TableOfContents policy={policy} />
        <div className="mt-10 space-y-10">
          {policy.sections.map((section, index) => (
            <section
              id={section.id}
              key={section.id}
              className="scroll-mt-28 break-inside-avoid"
              aria-labelledby={`${section.id}-heading`}
            >
              <h2
                id={`${section.id}-heading`}
                className="font-serif text-2xl font-bold leading-tight text-[#002147] sm:text-3xl"
              >
                {index + 1}. {section.heading}
              </h2>
              {section.blocks.map(renderBlock)}
            </section>
          ))}
        </div>
        <RelatedPolicies policy={policy} />
        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-500">
          <p>
            Contact:{" "}
            <a
              href={`mailto:${legalConfig.legalContactEmail}`}
              className="font-semibold text-[#002147] underline"
            >
              {legalConfig.legalContactEmail}
            </a>
          </p>
          <p>
            No institutional affiliation, legal representative, physical mailing
            address, or registration number is claimed unless later configured
            and published.
          </p>
        </footer>
      </article>
    </main>
  );
}
