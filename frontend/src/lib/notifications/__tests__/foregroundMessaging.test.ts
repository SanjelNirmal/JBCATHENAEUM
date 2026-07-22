import { beforeEach, describe, expect, it } from "vitest";
import type { MessagePayload } from "firebase/messaging";
import {
  normalizeForegroundMessage,
  resetForegroundMessageDeduplicationForTests,
} from "../foregroundMessaging";

function payload(data: Record<string, string>, messageId = "message-id"): MessagePayload {
  return { data, messageId, from: "test", collapseKey: "test" };
}

describe("foreground Firebase message normalization", () => {
  beforeEach(() => resetForegroundMessageDeduplicationForTests());

  it("supports notification and data title/body fields", () => {
    const fromNotification = normalizeForegroundMessage({
      ...payload({ notificationId: "one", url: "/resources" }),
      notification: { title: "Published", body: "A resource is ready" },
    });
    const fromData = normalizeForegroundMessage(
      payload({ notificationId: "two", title: "Review", body: "Decision ready" }),
    );
    expect(fromNotification).toMatchObject({ title: "Published", body: "A resource is ready" });
    expect(fromData).toMatchObject({ title: "Review", body: "Decision ready" });
  });

  it("ignores duplicate notification IDs for five minutes", () => {
    expect(normalizeForegroundMessage(payload({ notificationId: "duplicate" }))).not.toBeNull();
    expect(normalizeForegroundMessage(payload({ notificationId: "duplicate" }))).toBeNull();
  });

  it("falls back to /resources for unsafe external destinations", () => {
    expect(
      normalizeForegroundMessage(
        payload({ notificationId: "unsafe", url: "https://attacker.example/phish" }),
      )?.url,
    ).toBe("/resources");
  });
});
