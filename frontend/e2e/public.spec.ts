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

test("resource detail exposes engagement and the optional support gate", async ({
  page,
}) => {
  const ids = {
    campus: "00000000-0000-4000-8000-000000000001",
    faculty: "00000000-0000-4000-8000-000000000002",
    program: "00000000-0000-4000-8000-000000000003",
    curriculum: "00000000-0000-4000-8000-000000000004",
    term: "00000000-0000-4000-8000-000000000005",
    subject: "00000000-0000-4000-8000-000000000006",
    category: "00000000-0000-4000-8000-000000000007",
    resource: "00000000-0000-4000-8000-000000000008",
    version: "00000000-0000-4000-8000-000000000009",
  };
  await page.route("**/rest/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split("/").at(-1);
    const rows: Record<string, unknown[]> = {
      resources: [
        {
          id: ids.resource,
          title: "Project I",
          slug: "project-i",
          description: "Project proposal",
          academic_year: 2082,
          resource_type: "project",
          program_id: ids.program,
          term_id: ids.term,
          subject_id: ids.subject,
          category_id: ids.category,
          author_name: "Student",
          download_count: 4,
          created_at: "2026-07-18T00:00:00Z",
          current_version_id: ids.version,
          file_url: null,
        },
      ],
      resource_versions: [{ byte_size: 1024, page_count: 2 }],
      campuses: [
        {
          id: ids.campus,
          name: "Jana Bhawana Campus",
          slug: "jana-bhawana-campus",
        },
      ],
      faculties: [
        {
          id: ids.faculty,
          campus_id: ids.campus,
          name: "Humanities",
          slug: "humanities",
        },
      ],
      programs: [
        {
          id: ids.program,
          campus_id: ids.campus,
          faculty_id: ids.faculty,
          name: "BCA",
          slug: "bca",
          display_order: 1,
        },
      ],
      curriculum_versions: [
        {
          id: ids.curriculum,
          program_id: ids.program,
          name: "Current",
          is_current: true,
        },
      ],
      terms: [
        {
          id: ids.term,
          program_id: ids.program,
          curriculum_version_id: ids.curriculum,
          name: "Sixth Semester",
          slug: "sixth-semester",
          display_order: 6,
        },
      ],
      subjects: [
        {
          id: ids.subject,
          program_id: ids.program,
          curriculum_version_id: ids.curriculum,
          term_id: ids.term,
          name: "Project-I",
          slug: "project-i",
          display_order: 1,
        },
      ],
      resource_categories: [
        {
          id: ids.category,
          campus_id: ids.campus,
          name: "Projects",
          slug: "projects",
          display_order: 1,
        },
      ],
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(rows[table ?? ""] ?? []),
    });
  });
  await page.route("**/rest/v1/rpc/get_resource_rating_summary", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ average_rating: 4.5, rating_count: 2 }]),
    }),
  );
  await page.route("**/functions/v1/resource-download**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: "%PDF",
    }),
  );

  await page.goto("/resources/project-i");
  await expect(page.getByRole("heading", { name: "Project I" })).toBeVisible();
  await expect(page.getByText("4.5 from 2 ratings")).toBeVisible();
  await expect(page.getByText(/Sign in to save or rate/)).toBeVisible();
  await page.getByRole("button", { name: "Open in new window" }).click();
  await expect(
    page.getByRole("dialog", { name: "Buy Me a Coffee" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close Buy Me a Coffee dialog" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Buy Me a Coffee" }),
  ).toBeHidden();
});

test("account aliases stay protected and PWA mobile layout is present", async ({
  page,
}) => {
  for (const path of [
    "/account/bookmarks",
    "/profile/downloads",
    "/account/preferences",
    "/profile/devices",
  ]) {
    const aliasPage = await page.context().newPage();
    await aliasPage.goto(path);
    await aliasPage.waitForURL(
      (url) =>
        url.pathname === "/login" && url.searchParams.get("redirect") === path,
    );
    await aliasPage.close();
  }
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/site.webmanifest",
  );
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    headerSafeArea: getComputedStyle(document.querySelector("header")!)
      .paddingTop,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width);
  expect(viewport.headerSafeArea).toBeTruthy();
});
