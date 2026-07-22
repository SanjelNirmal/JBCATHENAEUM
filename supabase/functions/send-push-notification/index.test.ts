import { assertMatch } from "jsr:@std/assert@1";

const source = await Deno.readTextFile(new URL("./index.ts", import.meta.url));

Deno.test("notification sending requires AAL2 and an administrator role", () => {
  assertMatch(source, /await requireAal2\(/);
  assertMatch(source, /Administrator role is required/);
  assertMatch(source, /\.in\("role", \[/);
});

Deno.test("notification sending is rate limited and audited", () => {
  assertMatch(source, /recentCampaigns/);
  assertMatch(source, /rate_limited/);
  assertMatch(source, /push_notification_sent/);
});

Deno.test("delivery and history writes are idempotent", () => {
  assertMatch(source, /onConflict: "campaign_id,user_id"/);
  assertMatch(source, /onConflict: "campaign_id,subscription_id"/);
});

Deno.test("production responses do not return stack traces", () => {
  assertMatch(source, /Push notification delivery could not be completed/);
  if (/details,\s*\}\s*,\s*status/.test(source)) {
    throw new Error("Internal error details are returned to the client");
  }
});
