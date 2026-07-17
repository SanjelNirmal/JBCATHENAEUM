import { useEffect, useState } from "react";
import { enrollTotp, listMfaFactors, verifyTotp } from "../lib/supabase/auth";
import { toSafeErrorMessage } from "../lib/supabase/errors";

interface Enrollment {
  id: string;
  totp: { qr_code: string; secret: string; uri: string };
}

export function MfaPanel() {
  const [factorId, setFactorId] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void listMfaFactors()
      .then((factors) =>
        setFactorId(
          factors.find((factor) => factor.status === "verified")?.id ?? "",
        ),
      )
      .catch(() => setMessage("MFA factors could not be loaded."));
  }, []);
  const begin = async () => {
    setBusy(true);
    try {
      const data = await enrollTotp();
      setEnrollment(data as Enrollment);
      setFactorId(data.id);
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "auth"));
    } finally {
      setBusy(false);
    }
  };
  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const code = String(new FormData(event.currentTarget).get("code") ?? "");
      await verifyTotp(factorId, code);
      window.location.reload();
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "auth"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-7">
      <h1 className="font-serif text-3xl font-bold text-[#002147]">
        Multi-factor authentication required
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Administrative and moderation access requires an AAL2 session. Use an
        authenticator application.
      </p>
      {message && (
        <p
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {message}
        </p>
      )}
      {!factorId && !enrollment ? (
        <button
          onClick={() => void begin()}
          disabled={busy}
          className="mt-6 min-h-11 rounded-lg bg-[#002147] px-5 font-bold text-white"
        >
          Set up authenticator
        </button>
      ) : (
        <>
          {enrollment && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center">
              <img
                src={enrollment.totp.qr_code}
                alt="QR code for authenticator enrollment"
                className="mx-auto h-48 w-48"
              />
              <p className="mt-3 break-all text-xs text-slate-600">
                Manual key: {enrollment.totp.secret}
              </p>
            </div>
          )}
          <form onSubmit={verify} className="mt-6">
            <label className="block text-sm font-semibold">
              Six-digit code
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={8}
                className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-lg tracking-widest"
              />
            </label>
            <button
              disabled={busy}
              className="mt-4 min-h-11 rounded-lg bg-[#002147] px-5 font-bold text-white"
            >
              Verify and continue
            </button>
          </form>
        </>
      )}
    </section>
  );
}
