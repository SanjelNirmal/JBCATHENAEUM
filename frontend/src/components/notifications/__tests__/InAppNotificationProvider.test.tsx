import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ForegroundMessage } from "../../../lib/notifications/foregroundMessaging";

const mocks = vi.hoisted(() => ({
  callback: undefined as ((message: ForegroundMessage) => void) | undefined,
  markRead: vi.fn(),
}));

vi.mock("../../../app/AuthContext", () => ({
  useCurrentAuth: () => ({ user: { id: "user-one" }, profile: { role: "student" }, loading: false }),
}));
vi.mock("../../../features/engagement/hooks", () => ({
  useNotificationPreferences: () => ({
    data: {
      inAppEnabled: true,
      foregroundPopupEnabled: true,
      notificationSoundEnabled: false,
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: "UTC",
      accountSecurity: true,
      pastQuestions: true,
      newResources: true,
      systemAnnouncements: true,
      resourceUpdates: true,
    },
  }),
}));
vi.mock("../../../lib/notifications/foregroundMessaging", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/notifications/foregroundMessaging")>();
  return {
    ...original,
    subscribeToForegroundMessages: (callback: (message: ForegroundMessage) => void) => {
      mocks.callback = callback;
      return () => undefined;
    },
  };
});
vi.mock("../../../lib/notifications/foregroundSound", () => ({
  initializeNotificationSoundInteractionTracking: () => () => undefined,
  playForegroundNotificationSound: vi.fn().mockResolvedValue(false),
}));
vi.mock("../../../lib/supabase/notifications", () => ({
  markNotificationRead: mocks.markRead,
}));
vi.mock("../../../platform", () => ({ platformRuntime: { isNative: () => false } }));

import { InAppNotificationProvider } from "../InAppNotificationProvider";

function Location() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

function renderProvider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/"]}>
        <InAppNotificationProvider>
          <Routes>
            <Route path="*" element={<Location />} />
          </Routes>
        </InAppNotificationProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const message: ForegroundMessage = {
  title: "New note",
  body: "A reviewed note is available.",
  url: "/resources/example",
  notificationId: "notification-one",
  resourceId: null,
  category: "new_resource",
  icon: "/icons/icon-192.png",
  timestamp: Date.now(),
};

describe("in-app notification provider", () => {
  beforeEach(() => {
    mocks.callback = undefined;
    mocks.markRead.mockReset().mockResolvedValue(undefined);
  });

  it("shows one popup for a foreground message and opens its safe route", async () => {
    renderProvider();
    act(() => mocks.callback?.(message));
    expect(screen.getAllByRole("status")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: /New note/i }));
    expect(screen.getByTestId("location")).toHaveTextContent("/resources/example");
    expect(mocks.markRead).toHaveBeenCalledWith("notification-one");
  });

  it("close dismisses without navigating", async () => {
    renderProvider();
    act(() => mocks.callback?.(message));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    expect(mocks.markRead).not.toHaveBeenCalled();
  });
});
