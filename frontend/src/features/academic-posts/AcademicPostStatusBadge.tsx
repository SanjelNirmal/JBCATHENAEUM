import type { AcademicPostStatus } from "./types";

const styles: Record<AcademicPostStatus | "deleted", string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-blue-100 text-blue-800",
  archived: "bg-amber-100 text-amber-800",
  deleted: "bg-red-100 text-red-800",
};

export function AcademicPostStatusBadge({
  status,
  deleted = false,
}: {
  status: AcademicPostStatus;
  deleted?: boolean;
}) {
  const value = deleted ? "deleted" : status;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${styles[value]}`}
    >
      {value}
    </span>
  );
}
