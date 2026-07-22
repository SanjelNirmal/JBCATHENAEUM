import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

describe("PWA safety configuration", () => {
  it("ships a valid standalone manifest with purpose-built icons", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(root, "public/site.webmanifest"), "utf8"),
    ) as {
      display: string;
      start_url: string;
      scope: string;
      icons: Array<{ sizes: string; purpose?: string }>;
    };
    expect(manifest).toMatchObject({
      display: "standalone",
      start_url: "/",
      scope: "/",
    });
    expect(manifest.icons.some((icon) => icon.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some((icon) => icon.sizes === "512x512")).toBe(true);
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(
      true,
    );
  });

  it("keeps Supabase, signed URLs, and PDFs out of runtime caches", () => {
    const config = readFileSync(resolve(root, "vite.config.ts"), "utf8");
    expect(config).toMatch(/globIgnores:\s*\[[\s\S]*"\*\*\/\*\.pdf"[\s\S]*"payment\/\*\*"/);
    for (const endpoint of [
      "\\/auth\\/v1\\/",
      "\\/rest\\/v1\\/",
      "\\/functions\\/v1\\/",
      "\\/storage\\/v1\\/object\\/",
    ]) {
      expect(config).toContain(endpoint);
    }
    expect(
      config.match(/handler: "NetworkOnly"/g)?.length,
    ).toBeGreaterThanOrEqual(4);
  });

  it("includes an offline shell and update-prompt registration", () => {
    expect(
      readFileSync(resolve(root, "public/offline.html"), "utf8"),
    ).toMatch(/offline/i);
    const config = readFileSync(resolve(root, "vite.config.ts"), "utf8");
    expect(config).toContain('registerType: "autoUpdate"');
    expect(config).not.toContain('navigateFallback: "/index.html"');
    expect(config).toContain('fallbackURL: "/offline.html"');
    const manager = readFileSync(
      resolve(root, "src/components/PwaManager.tsx"),
      "utf8",
    );
    expect(manager).toContain("useRegisterSW");
    expect(manager).toContain("updateServiceWorker");
  });

  it("does not cache the SPA shell while keeping hashed assets immutable", () => {
    const headers = readFileSync(resolve(root, "public/_headers"), "utf8");
    expect(headers).toMatch(
      /\/\*[\s\S]*Cache-Control: no-cache, no-store, must-revalidate, no-transform/,
    );
    expect(headers).toMatch(
      /\/assets\/\*[\s\S]*! Cache-Control[\s\S]*Cache-Control: public, max-age=31536000, immutable/,
    );
  });

  it("never rewrites missing JavaScript assets to the SPA HTML shell", () => {
    const redirects = readFileSync(resolve(root, "public/_redirects"), "utf8");
    expect(redirects).not.toMatch(/^\/\*\s+\/index\.html\s+200/m);
    expect(redirects).toContain("/resources/* / 200");
    expect(redirects).toContain("/admin/* / 200");
    expect(readFileSync(resolve(root, "public/404.html"), "utf8")).toContain(
      "Page not found",
    );
    expect(readFileSync(resolve(root, "vite.config.ts"), "utf8")).toContain(
      "chunkFileNames",
    );
  });

  it("uses one Workbox worker for duplicate-safe background notifications", () => {
    const config = readFileSync(resolve(root, "vite.config.ts"), "utf8");
    const worker = readFileSync(
      resolve(root, "public/firebase-messaging-sw.js"),
      "utf8",
    );
    expect(config).toContain('importScripts: ["firebase-messaging-sw.js"]');
    expect(worker).toMatch(/self\.registration\s*\.showNotification/);
    expect(worker).toContain("self.registration.getNotifications");
    expect(worker).toContain("notification.data?.notificationId === notificationId");
    expect(worker).toContain("silent: false");
    expect(worker).toContain("vibrate: [");
  });

  it("focuses or opens a same-origin route when an OS notification is clicked", () => {
    const worker = readFileSync(
      resolve(root, "public/firebase-messaging-sw.js"),
      "utf8",
    );
    expect(worker).toContain('value.startsWith("/")');
    expect(worker).toContain('value.startsWith("//")');
    expect(worker).toMatch(/await client\.focus\(\)/);
    expect(worker).toMatch(/await client\.navigate\s*\(/);
    expect(worker).toContain(".openWindow(");
  });
});
