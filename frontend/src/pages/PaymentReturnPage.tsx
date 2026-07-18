import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { publicEnvironment } from "../lib/env";

export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const hasReference = Boolean(
    params.get("order") || params.get("order_id") || params.get("reference"),
  );

  useEffect(() => {
    window.history.replaceState(window.history.state, "", "/payment/return");
  }, []);

  return (
    <main id="main-content" className="mx-auto w-full max-w-lg px-5 py-16">
      <Seo
        title="Payment return"
        description="Return from a payment provider."
        path="/payment/return"
        noIndex
      />
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-[#002147]">
          Payment status not changed
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600" role="status">
          {hasReference
            ? "A return reference was received, but it is not payment proof. No access or entitlement has been granted."
            : "No verified payment reference was received. No access or entitlement has been granted."}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {publicEnvironment.config.nativeExternalPaymentsEnabled
            ? "Server-side verification is not configured for this resource, so the application remains locked."
            : "External payment controls are disabled in native builds pending Apple and Google paid-content policy review."}
        </p>
        <Link
          to="/resources"
          replace
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#002147] px-5 font-bold text-white"
        >
          Return to resources
        </Link>
      </section>
    </main>
  );
}
