import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const frontend = resolve(import.meta.dirname, "../../..");

describe("native release configuration", () => {
  it("uses the frontend dist directory and disables cleartext", () => {
    const config = readFileSync(
      resolve(frontend, "capacitor.config.ts"),
      "utf8",
    );
    expect(config).toContain('webDir: "dist"');
    expect(config).toContain("cleartext: false");
    expect(config).toContain("allowMixedContent: false");
  });

  it("requests only Internet on Android and disables backups/cleartext", () => {
    const manifest = readFileSync(
      resolve(frontend, "android/app/src/main/AndroidManifest.xml"),
      "utf8",
    );
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
    expect(manifest).toContain("android.permission.INTERNET");
    expect(manifest).not.toContain("READ_EXTERNAL_STORAGE");
    expect(manifest).not.toContain("WRITE_EXTERNAL_STORAGE");
    expect(manifest).not.toContain("FileProvider");
  });

  it("registers the iOS scheme without arbitrary transport loads", () => {
    const plist = readFileSync(
      resolve(frontend, "ios/App/App/Info.plist"),
      "utf8",
    );
    expect(plist).toContain("jbcathenaeum");
    expect(plist).toMatch(/NSAllowsArbitraryLoads<\/key>\s*<false\/>/);
  });
});
