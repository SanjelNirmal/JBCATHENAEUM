import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { RouteErrorBoundary } from "../RouteErrorBoundary";

const routeErrorMocks = vi.hoisted(() => ({
  error: new Error("route failed"),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useRouteError: () => routeErrorMocks.error,
  };
});

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    routeErrorMocks.error = new Error("route failed");
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it("reloads once automatically for stale deployed chunks", () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    });
    routeErrorMocks.error = new Error(
      "Failed to fetch dynamically imported module",
    );

    render(
      <MemoryRouter>
        <RouteErrorBoundary />
      </MemoryRouter>,
    );

    expect(reload).toHaveBeenCalled();
  });

  it("shows a reload action when automatic chunk recovery already ran", async () => {
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    });
    window.sessionStorage.setItem("jbc:last-chunk-reload", String(Date.now()));
    routeErrorMocks.error = new Error(
      "Failed to fetch dynamically imported module",
    );

    render(
      <MemoryRouter>
        <RouteErrorBoundary />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Reload this page" }),
    ).toBeVisible();
    expect(reload).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Reload page" }));
    expect(reload).toHaveBeenCalled();
  });
});
