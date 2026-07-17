import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Database,
  HardDrive,
  ShieldCheck,
} from "lucide-react";
import { LATEST_DATABASE_MIGRATION, publicEnvironment } from "../../lib/env";
import { supabase } from "../../lib/supabase";

type CheckState = "checking" | "healthy" | "warning" | "unavailable";

interface RuntimeStatus {
  database: CheckState;
  migration: CheckState;
  storage: CheckState;
  databaseDetail: string;
  migrationDetail: string;
  storageDetail: string;
}

const initialStatus: RuntimeStatus = {
  database: "checking",
  migration: "checking",
  storage: "checking",
  databaseDetail: "Checking Supabase connectivity…",
  migrationDetail: "Checking the latest platform schema marker…",
  storageDetail: "Checking storage configuration…",
};

function StatusIcon({ state }: { state: CheckState }) {
  if (state === "healthy")
    return <CheckCircle2 className="text-emerald-600" size={20} />;
  if (state === "warning")
    return <CircleAlert className="text-amber-600" size={20} />;
  if (state === "unavailable")
    return <CircleAlert className="text-red-600" size={20} />;
  return <CircleHelp className="animate-pulse text-slate-400" size={20} />;
}

function StatusRow({
  icon,
  title,
  state,
  detail,
}: {
  icon: ReactNode;
  title: string;
  state: CheckState;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mt-0.5 text-[#002147]">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <StatusIcon state={state} />
        </div>
        <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export function SystemStatusPanel() {
  const [status, setStatus] = useState(initialStatus);
  const { appVersion, deployedAt, storageBucket } = publicEnvironment.config;

  useEffect(() => {
    let cancelled = false;

    async function checkRuntime() {
      const [databaseResult, migrationResult] = await Promise.all([
        supabase.from("resources").select("id", { count: "exact", head: true }),
        supabase
          .from("subjects")
          .select("id", { count: "exact", head: true })
          .eq("code", "BCA 451"),
      ]);

      let storageState: CheckState = "warning";
      let storageDetail =
        "No read-only storage health bucket is configured for this deployment.";
      if (storageBucket) {
        const storageResult = await supabase.storage
          .from(storageBucket)
          .list("", { limit: 1 });
        storageState = storageResult.error ? "unavailable" : "healthy";
        storageDetail = storageResult.error
          ? `Bucket “${storageBucket}” is configured but unavailable to this session.`
          : `Bucket “${storageBucket}” is reachable.`;
      }

      if (cancelled) return;
      setStatus({
        database: databaseResult.error ? "unavailable" : "healthy",
        databaseDetail: databaseResult.error
          ? "The resources query failed. Check deployment variables, network access, and RLS."
          : "Supabase responded to a read-only resources query.",
        migration:
          migrationResult.error || migrationResult.count !== 1
            ? "warning"
            : "healthy",
        migrationDetail: migrationResult.error
          ? `Migration ${LATEST_DATABASE_MIGRATION} could not be verified from this session.`
          : migrationResult.count !== 1
            ? `Migration ${LATEST_DATABASE_MIGRATION} has not populated its catalog marker.`
            : `Migration marker ${LATEST_DATABASE_MIGRATION} is present.`,
        storage: storageState,
        storageDetail,
      });
    }

    void checkRuntime();
    return () => {
      cancelled = true;
    };
  }, [storageBucket]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c49b63]">
          Read-only diagnostics
        </p>
        <h2 className="mt-2 text-2xl font-serif font-bold text-[#002147]">
          System status
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          This page cannot execute SQL or change infrastructure. It reports safe
          configuration metadata and live connectivity checks only.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusRow
          icon={<Database size={20} />}
          title="Supabase database"
          state={status.database}
          detail={status.databaseDetail}
        />
        <StatusRow
          icon={<ShieldCheck size={20} />}
          title="Latest database migration"
          state={status.migration}
          detail={status.migrationDetail}
        />
        <StatusRow
          icon={<HardDrive size={20} />}
          title="Supabase Storage"
          state={status.storage}
          detail={status.storageDetail}
        />
        <StatusRow
          icon={<CheckCircle2 size={20} />}
          title="Deployment metadata"
          state={appVersion === "unversioned" ? "warning" : "healthy"}
          detail={`Version: ${appVersion}. Deployed at: ${deployedAt}.`}
        />
      </div>
    </section>
  );
}
