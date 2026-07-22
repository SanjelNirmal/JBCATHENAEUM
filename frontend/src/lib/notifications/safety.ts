export function safeNotificationRoute(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\r\n]/.test(value)
  ) return "/resources";
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/resources";
  } catch {
    return "/resources";
  }
}

export function openNotificationRoute(value: unknown) {
  window.dispatchEvent(new CustomEvent("jbc:navigate", { detail: safeNotificationRoute(value) }));
}
