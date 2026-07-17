import type { EnvironmentIssue } from "../lib/env";

export function ConfigurationErrorScreen({ issues }: { issues: EnvironmentIssue[] }) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-2xl rounded-2xl border border-amber-400/30 bg-slate-900 p-8 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          Configuration required
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold">JBC ATHENAEUM cannot start safely.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The deployment is missing required public configuration. No secret values are displayed.
        </p>
        <ul className="mt-6 space-y-3">
          {issues.map((issue) => (
            <li key={`${issue.variable}-${issue.message}`} className="rounded-lg bg-white/5 p-4">
              <code className="text-sm font-semibold text-amber-300">{issue.variable}</code>
              <p className="mt-1 text-sm text-slate-300">{issue.message}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-slate-400">
          A deployment administrator must configure these variables and redeploy the site.
        </p>
      </section>
    </main>
  );
}
