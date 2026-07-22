import { assertMatch } from "jsr:@std/assert@1";

const source = await Deno.readTextFile(new URL("./index.ts", import.meta.url));

Deno.test(
  "a completed file submission alerts active super administrators",
  () => {
    assertMatch(source, /\.eq\("role", "super_admin"\)/);
    assertMatch(source, /\.eq\("account_status", "active"\)/);
    assertMatch(source, /title: "New file submitted"/);
    assertMatch(source, /targetUrl: "\/admin\/reviews"/);
    assertMatch(source, /category: "moderation_update"/);
  },
);

Deno.test("submission notification jobs are idempotent per submission", () => {
  assertMatch(source, /super-admin-resource-submitted:\$\{submissionId\}/);
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
