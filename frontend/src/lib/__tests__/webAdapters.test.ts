import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  webDeviceAdapter,
  webNavigationAdapter,
  webShareAdapter,
} from "../../platform";

describe("web platform adapters", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("copies a share URL when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await expect(
      webShareAdapter.share({
        title: "Resource",
        text: "Academic resource",
        url: "https://example.test/resources/one",
      }),
    ).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(
      "https://example.test/resources/one",
    );
  });

  it("reserves a window synchronously and navigates it only to web URLs", () => {
    const replace = vi.fn();
    const target = {
      location: { replace },
      opener: window,
    } as unknown as Window;
    vi.spyOn(window, "open").mockReturnValue(target);
    const reservation = webNavigationAdapter.reserveExternal();
    reservation?.navigate("https://example.test/document");
    expect(replace).toHaveBeenCalledWith("https://example.test/document");
    expect(() => reservation?.navigate("javascript:alert(1)")).toThrow(
      "unsafe_external_url",
    );
  });

  it("opens an external URL directly without retaining an opener", async () => {
    const target = { opener: window } as unknown as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(target);

    await webNavigationAdapter.openExternal(
      "https://example.test/document.pdf",
    );

    expect(open).toHaveBeenCalledWith(
      "https://example.test/document.pdf",
      "_blank",
    );
    expect(target.opener).toBeNull();
  });

  it("creates a stable anonymous device key without claiming push support", async () => {
    const first = await webDeviceAdapter.register("Study browser");
    const second = await webDeviceAdapter.register("Study browser");
    expect(first?.deviceKey).toBe(second?.deviceKey);
    expect(first).toMatchObject({
      deviceName: "Study browser",
      pushToken: null,
    });
  });
});
