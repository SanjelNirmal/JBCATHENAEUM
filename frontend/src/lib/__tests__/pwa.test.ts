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
    expect(config).toContain('globIgnores: ["**/*.pdf", "payment/**"]');
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
    expect(config).toContain('registerType: "prompt"');
    const manager = readFileSync(
      resolve(root, "src/components/PwaManager.tsx"),
      "utf8",
    );
    expect(manager).toContain("useRegisterSW");
    expect(manager).toContain("updateServiceWorker");
  });
});
