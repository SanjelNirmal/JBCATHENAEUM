import { useEffect, useRef, type RefObject } from "react";
import { registerNativeDismissHandler } from "../platform/backNavigation";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Keeps keyboard focus inside a modal surface and restores the opener on close. */
export function useDialogFocus(
  active: boolean,
  container: RefObject<HTMLElement | null>,
  onEscape: () => void,
) {
  const escapeHandler = useRef(onEscape);
  escapeHandler.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const element = container.current;
    const focusable = () =>
      Array.from(
        element?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
    (
      element?.querySelector<HTMLElement>("[data-autofocus]") ?? focusable()[0]
    )?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        escapeHandler.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        element?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    const unregisterNativeDismiss = registerNativeDismissHandler(() =>
      escapeHandler.current(),
    );
    return () => {
      document.removeEventListener("keydown", handleKey);
      unregisterNativeDismiss();
      previous?.focus();
    };
  }, [active, container]);
}
