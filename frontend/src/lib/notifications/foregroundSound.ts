export interface ForegroundSoundOptions {
  enabled: boolean;
  quietHoursActive: boolean;
  categoryMuted: boolean;
}

let audio: HTMLAudioElement | null = null;
let interactionDetected = false;
let trackingStarted = false;

function recordInteraction(): void {
  interactionDetected = true;
}

export function initializeNotificationSoundInteractionTracking(): () => void {
  if (trackingStarted || typeof window === "undefined") return () => undefined;
  trackingStarted = true;
  const options: AddEventListenerOptions = { passive: true, once: true };
  window.addEventListener("pointerdown", recordInteraction, options);
  window.addEventListener("touchstart", recordInteraction, options);
  window.addEventListener("keydown", recordInteraction, { once: true });
  return () => {
    window.removeEventListener("pointerdown", recordInteraction);
    window.removeEventListener("touchstart", recordInteraction);
    window.removeEventListener("keydown", recordInteraction);
    trackingStarted = false;
  };
}

function notificationAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio("/sounds/notification.mp3");
    audio.preload = "auto";
    audio.volume = 0.32;
  }
  return audio;
}

async function playAudio(): Promise<boolean> {
  try {
    const instance = notificationAudio();
    instance.currentTime = 0;
    await instance.play();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      return false;
    }
    return false;
  }
}

export async function playForegroundNotificationSound(
  options: ForegroundSoundOptions,
): Promise<boolean> {
  if (
    !interactionDetected ||
    !options.enabled ||
    options.quietHoursActive ||
    options.categoryMuted ||
    document.visibilityState !== "visible"
  ) {
    return false;
  }
  return playAudio();
}

/** Must be called directly from a user-triggered event handler. */
export function playNotificationTestSound(): Promise<boolean> {
  interactionDetected = true;
  return playAudio();
}

export function resetForegroundSoundForTests(): void {
  audio = null;
  interactionDetected = false;
  trackingStarted = false;
}
