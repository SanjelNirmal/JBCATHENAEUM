import { z } from "zod";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { Seo } from "../components/Seo";
import { signIn, signUp } from "../lib/supabase/auth";
import { toSafeErrorMessage } from "../lib/supabase/errors";

const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(10)
  .max(128)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/);

export default function AuthPage() {
  const auth = useCurrentAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (auth.user && auth.profile)
    return <Navigate to={params.get("redirect") || "/"} replace />;
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      emailSchema.parse(email);
      if (mode === "signup") {
        passwordSchema.parse(password);
        await signUp(
          email,
          password,
          String(form.get("name") ?? ""),
          String(form.get("faculty") ?? ""),
        );
        setMessage(
          "Check your email and follow the verification link before signing in.",
        );
        setMode("login");
      } else {
        const result = await signIn(email, password);
        const target =
          params.get("redirect") ||
          (result.profile.role === "admin" ||
          result.profile.role === "super_admin" ||
          result.profile.role === "moderator"
            ? "/admin"
            : "/");
        navigate(target);
      }
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "auth"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="main-content" className="mx-auto w-full max-w-lg px-5 py-16">
      <Seo
        title={mode === "login" ? "Sign in" : "Create account"}
        description="Access your JBC Athenaeum account."
        path="/login"
        noIndex
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <h1 className="font-serif text-3xl font-bold text-[#002147]">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === "login"
            ? "Use your verified account."
            : "Email verification is required before uploading."}
        </p>
        {message && (
          <p className="mt-5 rounded-lg bg-slate-100 p-4 text-sm" role="status">
            {message}
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-5">
          {mode === "signup" && (
            <>
              <Field label="Full name" name="name" type="text" minLength={2} />
              <Field
                label="Faculty or program"
                name="faculty"
                type="text"
                minLength={2}
              />
            </>
          )}
          <Field label="Email" name="email" type="email" />
          <Field
            label="Password"
            name="password"
            type="password"
            minLength={mode === "signup" ? 10 : undefined}
            hint={
              mode === "signup"
                ? "At least 10 characters with uppercase, lowercase, and a number."
                : undefined
            }
          />
          <button
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-[#002147] px-5 font-bold text-white disabled:opacity-50"
          >
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
          {mode === "signup" && (
            <p className="text-xs leading-5 text-slate-500">
              By creating an account, you agree to the{" "}
              <Link to="/terms" className="font-semibold underline">
                Terms of Service
              </Link>{" "}
              and acknowledge the{" "}
              <Link to="/privacy" className="font-semibold underline">
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </form>
        <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
            }}
            className="font-bold text-[#002147] underline"
          >
            {mode === "login" ? "Create account" : "Already have an account?"}
          </button>
          <Link to="/forgot-password" className="text-slate-600 underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
function Field({
  label,
  name,
  type,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  minLength?: number;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required
        minLength={minLength}
        autoComplete={
          name === "email"
            ? "email"
            : name === "password"
              ? "current-password"
              : undefined
        }
        className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-3 focus:border-[#002147] focus:outline-none focus:ring-2 focus:ring-[#002147]/20"
      />
      {hint && (
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}
