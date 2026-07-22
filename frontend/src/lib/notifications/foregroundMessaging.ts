import { onMessage, type MessagePayload } from "firebase/messaging";
import { getFirebaseMessaging } from "../firebase/firebase";
import { safeNotificationRoute } from "./safety";

const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1_000;
const recentlySeenIds = new Map<string, number>();

export interface ForegroundMessage {
  title: string;
  body: string;
  url: string;
  notificationId: string;
  resourceId: string | null;
  category: string;
  icon: string;
  timestamp: number;
}

function cleanText(value: unknown, fallback: string, maximum: number): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maximum) : fallback;
}

function cleanIdentifier(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 160)
    : "";
}

function cleanIcon(value: unknown): string {
  return safeNotificationRoute(value || "/icons/icon-192.png");
}

function cleanTimestamp(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
}

function pruneRecentlySeen(now: number): void {
  for (const [id, seenAt] of recentlySeenIds) {
    if (now - seenAt > DEDUPLICATION_WINDOW_MS) recentlySeenIds.delete(id);
  }
}

export function normalizeForegroundMessage(
  payload: MessagePayload,
): ForegroundMessage | null {
  const data = payload.data ?? {};
  const notificationId = cleanIdentifier(
    data.notificationId || payload.messageId,
  );

  if (!notificationId) return null;

  const now = Date.now();
  pruneRecentlySeen(now);
  if (recentlySeenIds.has(notificationId)) return null;
  recentlySeenIds.set(notificationId, now);

  return {
    title: cleanText(
      payload.notification?.title ?? data.title,
      "JBC Athenaeum",
      120,
    ),
    body: cleanText(
      payload.notification?.body ?? data.body,
      "A new academic update is available.",
      500,
    ),
    url: safeNotificationRoute(data.url),
    notificationId,
    resourceId: cleanIdentifier(data.resourceId) || null,
    category: cleanIdentifier(data.category) || "academic_update",
    icon: cleanIcon(data.icon),
    timestamp: cleanTimestamp(data.timestamp),
  };
}

export function subscribeToForegroundMessages(
  callback: (message: ForegroundMessage) => void,
): () => void {
  let disposed = false;
  let unsubscribe: (() => void) | undefined;

  void getFirebaseMessaging()
    .then((messaging) => {
      if (!messaging || disposed) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const message = normalizeForegroundMessage(payload);
        if (message && !disposed) callback(message);
      });
    })
    .catch(() => {
      // Unsupported or incomplete Firebase configuration is reflected in the
      // notification settings status. Payloads and tokens are never logged.
    });

  return () => {
    disposed = true;
    unsubscribe?.();
  };
}

export function resetForegroundMessageDeduplicationForTests(): void {
  recentlySeenIds.clear();
}
