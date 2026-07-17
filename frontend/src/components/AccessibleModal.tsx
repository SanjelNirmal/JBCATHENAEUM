import { useRef, type ReactNode } from "react";
import { useDialogFocus } from "../lib/useDialogFocus";

export function AccessibleModal({
  children,
  onClose,
  labelledBy,
  label,
  className = "max-w-xl",
  closeOnBackdrop = true,
}: {
  children: ReactNode;
  onClose: () => void;
  labelledBy?: string;
  label?: string;
  className?: string;
  closeOnBackdrop?: boolean;
}) {
  const surface = useRef<HTMLDivElement>(null);
  useDialogFocus(true, surface, onClose);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      role="presentation"
      onMouseDown={() => {
        if (closeOnBackdrop) onClose();
      }}
    >
      <div
        ref={surface}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        onMouseDown={(event) => event.stopPropagation()}
        className={`max-h-[90vh] w-full overflow-auto rounded-2xl bg-white p-6 shadow-2xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
