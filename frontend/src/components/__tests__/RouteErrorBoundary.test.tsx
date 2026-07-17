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
  });

  it("shows a reload action for stale deployed chunks", async () => {
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

    expect(
      screen.getByRole("heading", { name: "Reload this page" }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Reload page" }));
    expect(reload).toHaveBeenCalled();
  });
});
