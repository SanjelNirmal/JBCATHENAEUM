import { useRef } from "react";
import { X } from "lucide-react";
import { useDialogFocus } from "../lib/useDialogFocus";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  requireReason = false,
  confirmationText,
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  requireReason?: boolean;
  confirmationText?: string;
  busy?: boolean;
  onConfirm: (reason: string, confirmation: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useDialogFocus(true, dialog, () => {
    if (!busy) onClose();
  });
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onConfirm(
      String(data.get("reason") ?? ""),
      String(data.get("confirmation") ?? ""),
    );
  };
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      role="presentation"
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="confirm-title"
              className="font-serif text-2xl font-bold text-[#002147]"
            >
              {title}
            </h2>
            <p
              id="confirm-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              {description}
            </p>
          </div>
          <button
            data-autofocus
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg"
          >
            <X />
          </button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          {requireReason && (
            <label className="block text-sm font-semibold">
              Reason
              <textarea
                name="reason"
                required
                minLength={3}
                maxLength={1000}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
          )}
          {confirmationText && (
            <label className="block text-sm font-semibold">
              Type{" "}
              <code className="rounded bg-slate-100 px-1">
                {confirmationText}
              </code>{" "}
              to continue
              <input
                name="confirmation"
                required
                pattern={confirmationText.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&",
                )}
                className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="min-h-11 rounded-lg border border-slate-300 px-5 font-bold"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              className={`min-h-11 rounded-lg px-5 font-bold text-white disabled:opacity-50 ${destructive ? "bg-red-700" : "bg-[#002147]"}`}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
