import { assert, assertEquals } from "jsr:@std/assert@1";
import { buildFcmMessage, type PushPayloadInput } from "./pushPayloads.ts";

const base: PushPayloadInput = {
  token: "test-token-not-a-real-registration-token",
  platform: "web",
  title: "New resource",
  body: "A reviewed resource is ready.",
  url: "/resources/example",
  notificationId: "notification-id",
  resourceId: "resource-id",
  category: "new_resource",
  timestamp: "1784720000000",
  important: false,
};

Deno.test("web payload is data-only", () => {
  const message = buildFcmMessage(base);
  assert(!("notification" in message));
  assertEquals((message.webpush as Record<string, unknown>).notification, undefined);
  assertEquals((message.data as Record<string, string>).title, base.title);
});

Deno.test("Android payload uses the academic channel and default sound", () => {
  const message = buildFcmMessage({ ...base, platform: "android", important: true });
  assertEquals((message.notification as Record<string, string>).title, base.title);
  const android = message.android as Record<string, unknown>;
  assertEquals(android.priority, "high");
  assertEquals((android.notification as Record<string, unknown>).channel_id, "academic_updates");
  assertEquals((android.notification as Record<string, unknown>).sound, "default");
});

Deno.test("iOS urgent payload uses APNs priority 10 and default sound", () => {
  const message = buildFcmMessage({ ...base, platform: "ios", important: true });
  const apns = message.apns as Record<string, Record<string, unknown>>;
  assertEquals(apns.headers["apns-priority"], "10");
  assertEquals((apns.payload.aps as Record<string, unknown>).sound, "default");
});
