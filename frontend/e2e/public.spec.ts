import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("public routes, URL filters, and unauthorized admin redirect", async ({
  page,
}) => {
  await page.goto("/resources?q=economics&page=2");
  await expect(
    page.getByRole("heading", { name: "Resource catalog" }),
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("Title, subject, program, contributor or year"),
  ).toHaveValue("economics");
  await expect(page).toHaveURL(/q=economics/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/path-that-does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});

test("mobile navigation supports keyboard open, Escape, and focus restoration", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile navigation test");
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Navigation" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Resources" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeHidden();
  await expect(opener).toBeFocused();
});

test("login and public catalog have no serious automated axe violations", async ({
  page,
}) => {
  await page.goto("/login");
  const loginResults = await new AxeBuilder({ page })
    .exclude("iframe")
    .analyze();
  expect(
    loginResults.violations.filter((item) =>
      ["critical", "serious"].includes(item.impact ?? ""),
    ),
  ).toEqual([]);

  await page.goto("/resources");
  const catalogResults = await new AxeBuilder({ page })
    .exclude("iframe")
    .analyze();
  expect(
    catalogResults.violations.filter((item) =>
      ["critical", "serious"].includes(item.impact ?? ""),
    ),
  ).toEqual([]);
});

test("database failures expose a safe retry state", async ({ page }) => {
  await page.route("**/rest/v1/rpc/search_public_resources", (route) =>
    route.abort("failed"),
  );
  await page.goto("/resources");
  await expect(page.getByRole("alert")).toContainText(
    "Resources could not be loaded.",
  );
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("supported viewport widths do not introduce horizontal page overflow", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Run the explicit viewport matrix once");
  for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/resources");
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(
      dimensions.content,
      `horizontal overflow at ${width}px`,
    ).toBeLessThanOrEqual(dimensions.viewport);
  }
});
