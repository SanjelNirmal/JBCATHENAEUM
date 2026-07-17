import { Check, Copy, Download, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { optionalSupportConfig } from "../config/payment";
import { AccessibleModal } from "./AccessibleModal";

export function BuyMeACoffeeModal({ onClose }: { onClose: () => void }) {
  const [copyStatus, setCopyStatus] = useState("");
  const [qrAvailable, setQrAvailable] = useState(true);

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(optionalSupportConfig.accountNumber);
      setCopyStatus("Account number copied.");
    } catch {
      setCopyStatus("Copy is unavailable. Select the account number manually.");
    }
  };

  return (
    <AccessibleModal
      onClose={onClose}
      labelledBy="coffee-modal-title"
      describedBy="coffee-modal-description"
      className="max-w-4xl"
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#85591f]">
            Optional support
          </p>
          <h2
            id="coffee-modal-title"
            className="mt-2 font-serif text-3xl font-bold text-[#002147]"
          >
            {optionalSupportConfig.title}
          </h2>
          <p
            id="coffee-modal-description"
            className="mt-3 max-w-2xl text-sm leading-6 text-slate-600"
          >
            JBC Athenaeum is free to use. No payment is required to browse or
            read resources. If the archive has helped you, an optional coffee
            helps cover hosting, storage, maintenance, and future improvements.
          </p>
        </div>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close Buy Me a Coffee dialog"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      <div className="mt-7 grid gap-7 md:grid-cols-[minmax(0,1fr)_19rem]">
        <div>
          <div className="rounded-xl border border-[#c49b63]/40 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong className="block text-[#002147]">
              Access always remains free
            </strong>
            Supporting the project is entirely optional and does not unlock,
            prioritize, or change access to any document.
          </div>

          <h3 className="mt-6 font-bold text-[#002147]">
            Bank transfer details
          </h3>
          <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 text-sm">
            <SupportDetail
              label="Bank name"
              value={optionalSupportConfig.bankName}
            />
            <SupportDetail
              label="Account holder"
              value={optionalSupportConfig.accountHolder}
            />
            <SupportDetail
              label="Account number"
              value={optionalSupportConfig.accountNumber}
            />
            <SupportDetail
              label="Branch code"
              value={optionalSupportConfig.branchCode}
            />
          </dl>

          <button
            type="button"
            onClick={() => void copyAccountNumber()}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#002147] px-4 font-bold text-[#002147] sm:w-auto"
          >
            {copyStatus === "Account number copied." ? (
              <Check aria-hidden="true" size={17} />
            ) : (
              <Copy aria-hidden="true" size={17} />
            )}
            Copy account number
          </button>
          {copyStatus && (
            <p aria-live="polite" className="mt-2 text-xs text-slate-600">
              {copyStatus}
            </p>
          )}

          <div className="mt-6 flex gap-3 rounded-xl bg-slate-100 p-4 text-xs leading-5 text-slate-700">
            <ShieldCheck
              aria-hidden="true"
              className="shrink-0 text-[#002147]"
              size={20}
            />
            <p>
              JBC Athenaeum will never ask for your bank password, OTP, PIN, or
              card credentials. Complete any transfer only inside your trusted
              banking or wallet application.
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {qrAvailable ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <img
                src={optionalSupportConfig.qrImagePath}
                alt="NMB Bank payment QR code for Nirmal Sanjel"
                onError={() => setQrAvailable(false)}
                className="aspect-square w-full rounded-xl bg-white object-contain"
              />
              <a
                href={optionalSupportConfig.qrImagePath}
                download="jbc-athenaeum-nmb-payment-qr.png"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-[#002147]"
              >
                <Download aria-hidden="true" size={17} />
                Save QR code
              </a>
            </div>
          ) : (
            <div
              role="status"
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm leading-6 text-slate-600"
            >
              The payment QR image has not been added yet. You can still use the
              verified account details shown here.
            </div>
          )}

          <div className="mt-auto pt-5">
            <p className="text-xs leading-5 text-slate-500">
              Thank you for considering support. You do not need to send a
              receipt or payment screenshot.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 min-h-11 w-full rounded-lg bg-[#002147] px-5 font-bold text-white"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </AccessibleModal>
  );
}

function SupportDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-5 gap-y-1 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-right font-semibold text-slate-900">
        {value}
      </dd>
    </div>
  );
}
