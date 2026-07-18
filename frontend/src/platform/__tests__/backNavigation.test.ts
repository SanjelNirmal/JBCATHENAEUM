import { describe, expect, it, vi } from "vitest";
import {
  dismissTopNativeOverlay,
  registerNativeDismissHandler,
} from "../backNavigation";

describe("native overlay dismissal", () => {
  it("dismisses only the topmost active overlay", () => {
    const first = vi.fn();
    const second = vi.fn();
    const removeFirst = registerNativeDismissHandler(first);
    const removeSecond = registerNativeDismissHandler(second);

    expect(dismissTopNativeOverlay()).toBe(true);
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();

    removeSecond();
    expect(dismissTopNativeOverlay()).toBe(true);
    expect(first).toHaveBeenCalledOnce();
    removeFirst();
    expect(dismissTopNativeOverlay()).toBe(false);
  });
});
