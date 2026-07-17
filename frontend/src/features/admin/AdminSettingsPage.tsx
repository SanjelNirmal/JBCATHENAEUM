import { Seo } from "../../components/Seo";
import { SystemStatusPanel } from "../../components/admin/SystemStatusPanel";
export default function AdminSettingsPage() {
  return (
    <main id="main-content">
      <Seo
        title="System settings"
        description="Read-only deployment and connectivity status."
        path="/admin/settings"
        noIndex
      />
      <h1 className="font-serif text-3xl font-bold text-[#002147]">
        System settings
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Sensitive configuration is managed through reviewed migrations and
        deployment secrets, never arbitrary browser SQL.
      </p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <SystemStatusPanel />
      </div>
    </main>
  );
}
