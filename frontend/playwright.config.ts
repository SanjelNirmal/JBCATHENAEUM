import { defineConfig, devices } from "@playwright/test";

const testSupabaseUrl =
  process.env.VITE_SUPABASE_URL ?? "https://e2e-placeholder.supabase.co";
const testSupabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? "e2e-public-placeholder";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_500 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 4173 --host 127.0.0.1",
    env: {
      ...process.env,
      VITE_SUPABASE_URL: testSupabaseUrl,
      VITE_SUPABASE_ANON_KEY: testSupabaseKey,
    },
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
});
