import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  initializeNotificationSoundInteractionTracking,
  playForegroundNotificationSound,
  resetForegroundSoundForTests,
} from "../foregroundSound";

const play = vi.fn<() => Promise<void>>();

class AudioMock {
  currentTime = 0;
  preload = "";
  volume = 1;
  play = play;
}

describe("foreground notification sound", () => {
  beforeEach(() => {
    resetForegroundSoundForTests();
    play.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal("Audio", AudioMock);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });

  it("does not play before a user interaction", async () => {
    await expect(
      playForegroundNotificationSound({ enabled: true, quietHoursActive: false, categoryMuted: false }),
    ).resolves.toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  it("respects the sound preference", async () => {
    initializeNotificationSoundInteractionTracking();
    window.dispatchEvent(new Event("pointerdown"));
    await playForegroundNotificationSound({ enabled: false, quietHoursActive: false, categoryMuted: false });
    expect(play).not.toHaveBeenCalled();
  });

  it("safely handles rejected audio playback", async () => {
    play.mockRejectedValue(new DOMException("Blocked", "NotAllowedError"));
    initializeNotificationSoundInteractionTracking();
    window.dispatchEvent(new Event("keydown"));
    await expect(
      playForegroundNotificationSound({ enabled: true, quietHoursActive: false, categoryMuted: false }),
    ).resolves.toBe(false);
  });
});
