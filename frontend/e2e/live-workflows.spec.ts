import { expect, test } from "@playwright/test";

const contributorEmail = process.env.E2E_CONTRIBUTOR_EMAIL;
const contributorPassword = process.env.E2E_CONTRIBUTOR_PASSWORD;
const liveProject = process.env.E2E_LIVE_PROJECT === "true";

test.describe("isolated live Supabase workflows", () => {
  test.skip(
    !liveProject || !contributorEmail || !contributorPassword,
    "Requires an isolated disposable Supabase test project and contributor credentials",
  );

  test("login, client file gates, submission tracking, and role boundary", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(contributorEmail!);
    await page.getByLabel("Password").fill(contributorPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto("/contribute");
    await page.getByLabel("PDF document").setInputFiles({
      name: "unsafe.html",
      mimeType: "text/html",
      buffer: Buffer.from("<script>alert(1)</script>"),
    });
    await expect(
      page.getByText(/Only files with a .pdf extension/),
    ).toBeVisible();
    await page.getByLabel("PDF document").setInputFiles({
      name: "oversized.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(25 * 1024 * 1024 + 1),
    });
    await expect(page.getByText(/no larger than 25 MB/)).toBeVisible();

    await page.goto("/my-submissions");
    await expect(
      page.getByRole("heading", { name: "My submissions" }),
    ).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/not-found|\/login/);
  });

  test("password recovery uses a non-enumerating response", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Send one recovery request per live test run");
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(contributorEmail!);
    await page.getByRole("button", { name: "Send recovery link" }).click();
    await expect(page.getByRole("status")).toContainText(
      "If the address belongs to an account",
    );
  });

  test("expired local session returns a contributor to sign in", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(contributorEmail!);
    await page.getByLabel("Password").fill(contributorPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await page.evaluate(() => localStorage.clear());
    await page.goto("/my-submissions");
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });
});
