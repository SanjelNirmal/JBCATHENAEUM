import { Minimize2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDialogFocus } from "../lib/useDialogFocus";

export function FullScreenDocumentViewer({
  title,
  url,
  onClose,
}: {
  title: string;
  url: string;
  onClose: () => void;
}) {
  const surface = useRef<HTMLDivElement>(null);
  useDialogFocus(true, surface, onClose);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      ref={surface}
      role="dialog"
      aria-modal="true"
      aria-labelledby="full-screen-document-title"
      className="fixed inset-0 z-[110] flex h-[100dvh] w-screen flex-col bg-slate-950"
    >
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/15 bg-[#002147] px-4 py-3 text-white sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
            Full-screen document
          </p>
          <h2
            id="full-screen-document-title"
            className="truncate font-serif text-lg font-bold sm:text-xl"
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Exit full screen"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-white/30 px-4 font-bold hover:bg-white/10"
        >
          <Minimize2 aria-hidden="true" size={18} />
          <span className="hidden sm:inline">Exit full screen</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </header>
      <iframe
        title={`Full-screen view of ${title}`}
        src={url}
        referrerPolicy="no-referrer"
        scrolling="yes"
        className="min-h-0 flex-1 bg-white"
      />
    </div>
  );
}
