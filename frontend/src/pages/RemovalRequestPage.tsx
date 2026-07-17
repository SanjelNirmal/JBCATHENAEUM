import { useState } from "react";
import { Seo } from "../components/Seo";
import { submitRemovalRequest } from "../lib/supabase/reports";
import { toSafeErrorMessage } from "../lib/supabase/errors";

export default function RemovalRequestPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await submitRemovalRequest({
        resourceId: String(form.get("resourceId") || "") || undefined,
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        relationship: String(form.get("relationship") || ""),
        reason: String(form.get("reason") || ""),
        details: String(form.get("details") || ""),
        evidenceUrl: String(form.get("evidenceUrl") || "") || undefined,
      });
      setSuccess(true);
      setMessage(`Request received. Reference: ${result.requestId}`);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
      <Seo
        title="Content removal request"
        description="Submit a structured copyright or content-removal request."
        path="/copyright/removal"
      />
      <h1 className="font-serif text-4xl font-bold text-[#002147]">
        Content removal request
      </h1>
      <p className="mt-4 leading-7 text-slate-600">
        Use this form if you own rights in a resource, represent an affected
        party, or believe content should be reviewed. Submitting a request does
        not guarantee removal. Final procedures require campus approval.
      </p>
      {message && (
        <p
          className={`mt-6 rounded-xl p-4 text-sm ${success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
          role="status"
        >
          {message}
        </p>
      )}
      <form
        onSubmit={submit}
        className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" name="name" />
          <Field label="Email" name="email" type="email" />
          <Field
            label="Relationship to the content"
            name="relationship"
            placeholder="Author, rights holder, subject…"
          />
          <Field
            label="Resource ID (if known)"
            name="resourceId"
            required={false}
          />
          <Field label="Reason" name="reason" />
        </div>
        <label className="block text-sm font-semibold">
          Details
          <textarea
            name="details"
            required
            minLength={20}
            maxLength={5000}
            rows={6}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </label>
        <Field
          label="Evidence URL (optional, HTTPS only)"
          name="evidenceUrl"
          type="url"
          required={false}
        />
        <button
          disabled={busy}
          className="min-h-12 rounded-xl bg-[#002147] px-6 font-bold text-white disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit removal request"}
        </button>
      </form>
    </main>
  );
}
function Field({
  label,
  name,
  type = "text",
  required = true,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
      />
    </label>
  );
}
