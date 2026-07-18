import { render, screen, waitFor } from "@testing-library/react";
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

  it("reloads once automatically with a cache-busting URL", async () => {
    const replace = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        href: "https://example.test/resources",
        pathname: "/resources",
        replace,
      },
    });
    routeErrorMocks.error = new Error(
      "Failed to fetch dynamically imported module",
    );

    render(
      <MemoryRouter>
        <RouteErrorBoundary />
      </MemoryRouter>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(String(replace.mock.calls[0]?.[0])).toContain("__jbc_refresh=");
  });

  it("shows a reload action when automatic chunk recovery already ran", async () => {
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
    const replace = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        href: "https://example.test/resources",
        pathname: "/resources",
        replace,
      },
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
    expect(replace).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: "Reload latest version" }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });
});
