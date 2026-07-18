import { ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../../../components/Seo";
import { legalConfig } from "../config/legalConfig";
import { getPolicyBySlug, primaryPolicySlugs } from "../content/policies";

export default function PoliciesIndexPage() {
  const policies = primaryPolicySlugs.map(getPolicyBySlug);
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-5 py-16">
      <Seo
        title="Policies"
        description="Legal and operational policies for JBC Athenaeum."
        path="/policies"
      />
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#85591f]">
          Governance documents
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black text-[#002147]">
          Policies
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          These documents explain how {legalConfig.platformName} handles
          privacy, terms, copyright, uploads, and retention. They are written
          for students and contributors, while preserving the legal details
          needed before broader launch.
        </p>
      </header>
      <section
        aria-label="Policy list"
        className="mt-10 grid gap-4 sm:grid-cols-2"
      >
        {policies.map((policy) => {
          const Icon = policy.icon ?? FileText;
          return (
            <Link
              key={policy.slug}
              to={policy.path}
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#c49b63] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <Icon aria-hidden="true" className="text-[#c49b63]" />
                <ArrowRight
                  aria-hidden="true"
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#85591f]"
                  size={18}
                />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-bold text-[#002147]">
                {policy.title}
              </h2>
              <p className="mt-3 leading-7 text-slate-600">{policy.summary}</p>
            </Link>
          );
        })}
      </section>
      <aside className="mt-10 rounded-lg border-l-4 border-[#c49b63] bg-amber-50 p-5 text-slate-800">
        <h2 className="font-serif text-xl font-bold text-[#002147]">
          Legal review required
        </h2>
        <p className="mt-2 leading-7">
          These policies do not claim final legal approval. They should be
          reviewed by a qualified legal professional in Nepal before commercial
          deployment or official institutional rollout.
        </p>
      </aside>
    </main>
  );
}
