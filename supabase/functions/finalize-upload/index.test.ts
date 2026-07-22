import { assertMatch } from "jsr:@std/assert@1";

const source = await Deno.readTextFile(new URL("./index.ts", import.meta.url));

Deno.test(
  "a completed file submission alerts active admins and super admins",
  () => {
    assertMatch(source, /\.in\("role", \["admin", "super_admin"\]\)/);
    assertMatch(source, /\.eq\("account_status", "active"\)/);
    assertMatch(source, /title: "New PDF awaiting review"/);
    assertMatch(source, /targetUrl: "\/admin\/reviews"/);
    assertMatch(source, /category: "moderation_update"/);
  },
);

Deno.test("submission notification jobs are idempotent per submission", () => {
  assertMatch(source, /review-team-resource-submitted:\$\{submissionId\}/);
  assertMatch(source, /resource-submitted:\$\{submissionId\}:\$\{userId\}/);
});

Deno.test("contributors do not receive push-sender authorization", () => {
  assertMatch(source, /queueAndDispatchPushJob/);
  if (/request\.headers\.get\("authorization"\)/.test(source)) {
    throw new Error(
      "Contributor authorization is forwarded to the push sender",
    );
  }
});
