import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { exchangeAuthCode, waitForCurrentSession } from "../lib/supabase/auth";
import { safeAuthNext } from "../platform";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [message, setMessage] = useState("Completing secure sign-in…");

  useEffect(() => {
    let active = true;
    const code = params.get("code");
    const callbackError = params.get("error") || params.get("error_code");
    const next = safeAuthNext(params.get("next"));

    // Callback values are captured in memory and immediately removed from the
    // visible route so codes never remain in history after processing.
    window.history.replaceState(window.history.state, "", "/auth/callback");

    const complete = async () => {
      if (callbackError) throw new Error("auth_callback_cancelled");
      let session = await waitForCurrentSession(1_200);
      if (!session && code) session = await exchangeAuthCode(code);
      if (!session) throw new Error("auth_callback_expired");
      if (active) navigate(next, { replace: true });
    };

    void complete().catch(() => {
      if (active) {
        setMessage(
          "This sign-in, verification, or recovery link is invalid, expired, or was cancelled. Request a new link and try again.",
        );
      }
    });
    return () => {
      active = false;
    };
  }, [navigate, params]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-lg px-5 py-16">
      <Seo
        title="Authentication callback"
        description="Complete secure account authentication."
        path="/auth/callback"
        noIndex
      />
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-[#002147]">
          Secure account link
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600" role="status">
          {message}
        </p>
        {!message.startsWith("Completing") && (
          <Link
            to="/login"
            replace
            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#002147] px-5 font-bold text-white"
          >
            Return to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
