import {
  ArrowUpRight,
  Coffee,
  FileCheck2,
  GraduationCap,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BuyMeACoffeeModal } from "./BuyMeACoffeeModal";

const platformLinks = [
  ["Resources", "/resources"],
  ["Academic directory", "/faculties"],
  ["Contribute", "/contribute"],
  ["Removal request", "/copyright/removal"],
] as const;

const policyLinks = [
  ["Policy Overview", "/policies"],
  ["Privacy Policy", "/privacy"],
  ["Terms of Service", "/terms"],
  ["Copyright Policy", "/copyright"],
  ["Upload Policy", "/policies/upload"],
  ["Data Retention Policy", "/policies/retention"],
] as const;

const accountLinks = [
  ["Sign in or sign up", "/login"],
  ["Password recovery", "/forgot-password"],
  ["Account deletion policy", "/policies/account-deletion"],
] as const;

export function SiteFooter() {
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  return (
    <>
      <footer className="mt-auto border-t border-[#c49b63]/20 bg-[#001b3a] text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-x-10 gap-y-8 px-5 py-8 sm:grid-cols-2 sm:px-6 sm:py-10 lg:grid-cols-[1.35fr_0.8fr_1fr_1.05fr] lg:px-8">
          <section aria-label="Platform summary">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c49b63]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d8b37a]">
                <GraduationCap aria-hidden="true" size={14} />
                Jana Bhawana Campus resources
              </div>
              <h2 className="mt-4 font-serif text-2xl font-bold leading-tight text-white">
                JBC Athenaeum
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                A moderated academic archive for TU BCA, BICTE, and campus
                learning resources.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <TrustBadge icon={ShieldCheck} label="Manually reviewed" />
                <TrustBadge
                  icon={FileCheck2}
                  label="Protected document access"
                />
              </div>
            </div>
          </section>

          <nav aria-label="Footer navigation" className="contents">
            <FooterLinks title="Platform" links={platformLinks} />
            <FooterLinks title="Policies" links={policyLinks} />
          </nav>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
              Account & Contact
            </h2>
            <FooterLinkList links={accountLinks} />
            <div className="mt-5 border-t border-white/10 pt-5 text-sm">
              <p className="font-semibold text-white">Nirmal Sanjel</p>
              <div className="mt-3 grid gap-2">
                <a
                  href="https://www.nirmalsanjel.com.np"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-8 items-center gap-2 text-[#d8b37a] transition hover:translate-x-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b37a]"
                >
                  nirmalsanjel.com.np
                  <ArrowUpRight aria-hidden="true" size={15} />
                </a>
                <a
                  href="mailto:admin@nirmalsanjel.com.np"
                  className="inline-flex min-h-8 items-center gap-2 text-[#d8b37a] transition hover:translate-x-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b37a]"
                >
                  <Mail aria-hidden="true" size={15} />
                  admin@nirmalsanjel.com.np
                </a>
              </div>
              <button
                type="button"
                onClick={() => setCoffeeOpen(true)}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#c49b63]/70 px-4 text-sm font-bold text-[#d8b37a] transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b37a]"
              >
                <Coffee aria-hidden="true" size={16} />
                Buy me a coffee
              </button>
            </div>
          </section>
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-sm text-slate-400">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
            <p>© 2026 JBC Athenaeum.</p>
            <p>Created by Nirmal Sanjel.</p>
          </div>
        </div>
      </footer>
      {coffeeOpen && <BuyMeACoffeeModal onClose={() => setCoffeeOpen(false)} />}
    </>
  );
}

function TrustBadge({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/10 px-3 text-xs font-semibold text-slate-300">
      <Icon aria-hidden="true" className="text-[#d8b37a]" size={14} />
      {label}
    </span>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
        {title}
      </h2>
      <FooterLinkList links={links} />
    </section>
  );
}

function FooterLinkList({
  links,
}: {
  links: readonly (readonly [string, string])[];
}) {
  return (
    <ul className="mt-4 grid gap-1 text-sm">
      {links.map(([label, to]) => (
        <li key={to}>
          <Link
            to={to}
            className="inline-flex min-h-8 items-center text-slate-300 transition hover:translate-x-1 hover:text-[#d8b37a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b37a]"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
