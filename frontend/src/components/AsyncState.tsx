import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="mx-auto flex min-h-48 max-w-xl items-center justify-center gap-3 p-8 text-slate-600"
      role="status"
    >
      <Loader2 className="animate-spin" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div
      className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
      role="alert"
    >
      <AlertCircle className="mx-auto mb-3 text-red-600" aria-hidden="true" />
      <p className="text-sm text-red-800">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-5 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <Inbox className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
      <h2 className="font-serif text-xl font-bold text-[#002147]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
