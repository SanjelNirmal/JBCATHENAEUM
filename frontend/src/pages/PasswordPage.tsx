import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Seo } from "../components/Seo";
import { requestPasswordReset, updatePassword } from "../lib/supabase/auth";
import { toSafeErrorMessage } from "../lib/supabase/errors";

export default function PasswordPage() {
  const reset = useLocation().pathname === "/reset-password";
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const value = String(
      new FormData(event.currentTarget).get(reset ? "password" : "email") ?? "",
    );
    try {
      if (reset) {
        if (value.length < 10) throw new Error("weak_password");
        await updatePassword(value);
        setMessage("Password updated. You can now continue.");
        window.setTimeout(() => navigate("/"), 1200);
      } else {
        await requestPasswordReset(value);
        setMessage(
          "If the address belongs to an account, a reset link has been sent.",
        );
      }
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "auth"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="main-content" className="mx-auto max-w-lg px-5 py-16">
      <Seo
        title={reset ? "Reset password" : "Forgot password"}
        description="Recover access to your account."
        path={reset ? "/reset-password" : "/forgot-password"}
        noIndex
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="font-serif text-3xl font-bold text-[#002147]">
          {reset ? "Choose a new password" : "Reset your password"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {reset
            ? "Use at least 10 characters."
            : "We will send a secure recovery link if the account exists."}
        </p>
        {message && (
          <p className="mt-5 rounded-lg bg-slate-100 p-4 text-sm" role="status">
            {message}
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block text-sm font-semibold">
            {reset ? "New password" : "Email"}
            <input
              name={reset ? "password" : "email"}
              type={reset ? "password" : "email"}
              required
              minLength={reset ? 10 : undefined}
              className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <button
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-[#002147] font-bold text-white disabled:opacity-50"
          >
            {busy
              ? "Please wait…"
              : reset
                ? "Update password"
                : "Send recovery link"}
          </button>
        </form>
        <Link
          to="/login"
          className="mt-6 inline-block text-sm font-bold text-[#002147] underline"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
