import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResourceEngagementPanel } from "../ResourceEngagementPanel";

const mocks = vi.hoisted(() => ({
  user: { id: "user-one" } as { id: string } | null,
  toggle: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  summary: { averageRating: 4.5, ratingCount: 2 },
  ownRating: {
    rating: 3,
    reviewText: "Useful",
    moderationStatus: "visible",
  },
}));

vi.mock("../../../app/AuthContext", () => ({
  useCurrentAuth: () => ({ user: mocks.user }),
}));

vi.mock("../hooks", () => ({
  useResourceBookmark: () => ({
    data: false,
    isLoading: false,
    toggle: mocks.toggle,
    mutation: { isPending: false },
  }),
  useResourceRatings: () => ({
    summary: {
      data: mocks.summary,
      isLoading: false,
      isError: false,
    },
    own: {
      data: mocks.ownRating,
      isLoading: false,
    },
    save: { mutateAsync: mocks.save, isPending: false },
    remove: { mutateAsync: mocks.remove, isPending: false },
  }),
}));

describe("ResourceEngagementPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: "user-one" };
  });

  it("lets a signed-in user bookmark, update, and delete their own rating", async () => {
    render(
      <MemoryRouter>
        <ResourceEngagementPanel resourceId="resource-one" />
      </MemoryRouter>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Save resource" }),
    );
    expect(mocks.toggle).toHaveBeenCalledWith(true);

    await userEvent.click(
      screen.getByRole("button", { name: "Rate 5 out of 5" }),
    );
    const review = screen.getByLabelText("Optional review");
    await userEvent.clear(review);
    await userEvent.type(review, "Excellent reference");
    await userEvent.click(
      screen.getByRole("button", { name: "Update rating" }),
    );
    expect(mocks.save).toHaveBeenCalledWith({
      rating: 5,
      reviewText: "Excellent reference",
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Delete my rating" }),
    );
    expect(mocks.remove).toHaveBeenCalledOnce();
  });

  it("shows only the aggregate and a sign-in path to anonymous visitors", () => {
    mocks.user = null;
    render(
      <MemoryRouter>
        <ResourceEngagementPanel resourceId="resource-one" />
      </MemoryRouter>,
    );
    expect(screen.getByText("4.5 from 2 ratings")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Sign in to save or rate" }),
    ).toHaveAttribute("href", expect.stringContaining("/login?redirect="));
    expect(screen.queryByLabelText("Optional review")).not.toBeInTheDocument();
  });
});
