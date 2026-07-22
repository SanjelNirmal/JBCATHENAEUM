import { assertEquals } from "jsr:@std/assert@1";
import {
  deliveryAllowed,
  isInvalidFcmTokenError,
  isQuietHoursActive,
} from "./notificationPolicy.ts";

const preference = {
  push_enabled: true,
  resource_updates: true,
  system_announcements: true,
  new_resources: true,
  past_questions: true,
  account_security: true,
  quiet_hours_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  timezone: "UTC",
};

Deno.test("quiet hours are enforced across midnight", () => {
  assertEquals(isQuietHoursActive(preference, new Date("2026-07-22T23:00:00Z")), true);
  assertEquals(deliveryAllowed("new_resource", preference, new Date("2026-07-22T23:00:00Z")), false);
});

Deno.test("account security bypasses quiet hours", () => {
  assertEquals(deliveryAllowed("account_security", preference, new Date("2026-07-22T23:00:00Z")), true);
});

Deno.test("invalid registration tokens are recognized", () => {
  assertEquals(isInvalidFcmTokenError("UNREGISTERED", "Delivery failed"), true);
  assertEquals(isInvalidFcmTokenError("INTERNAL", "Delivery failed"), false);
});
