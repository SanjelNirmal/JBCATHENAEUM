import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthPage from "../AuthPage";
import PasswordPage from "../PasswordPage";

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  getCurrentSession: vi.fn(),
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
}));
const contextMocks = vi.hoisted(() => ({
  current: {
    user: null,
    profile: null,
    loading: false,
    aal: null,
    emailVerified: false,
  } as {
    user: unknown;
    profile: unknown;
    loading: boolean;
    aal: "aal1" | "aal2" | null;
    emailVerified: boolean;
  },
}));

vi.mock("../../app/AuthContext", () => ({
  useCurrentAuth: () => contextMocks.current,
}));
vi.mock("../../lib/supabase/auth", () => ({
  ...authMocks,
}));

describe("authentication pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contextMocks.current = {
      user: null,
      profile: null,
      loading: false,
      aal: null,
      emailVerified: false,
    };
  });

  it("keeps the login form available for an incomplete profile session", () => {
    contextMocks.current = {
      user: { id: "user-without-profile" },
      profile: null,
      loading: false,
      aal: null,
      emailVerified: true,
    };
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  it("renders a labeled login and submits credentials", async () => {
    authMocks.signIn.mockResolvedValue({ profile: { role: "student" } });
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthPage />
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText("Email"), "student@example.edu");
    await userEvent.type(screen.getByLabelText("Password"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(authMocks.signIn).toHaveBeenCalledWith(
      "student@example.edu",
      "Password123",
    );
  });

  it("switches to signup and explains verification", async () => {
    authMocks.signUp.mockResolvedValue({ user: null });
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthPage />
      </MemoryRouter>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    await userEvent.type(screen.getByLabelText("Full name"), "Campus Student");
    await userEvent.type(screen.getByLabelText("Faculty or program"), "BCA");
    await userEvent.type(screen.getByLabelText("Email"), "new@example.edu");
    await userEvent.type(screen.getByLabelText(/Password/), "StrongPass123");
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(authMocks.signUp).toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "verification link",
    );
  });

  it("uses a non-enumerating password recovery confirmation", async () => {
    authMocks.requestPasswordReset.mockResolvedValue(undefined);
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <PasswordPage />
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText("Email"), "person@example.edu");
    await userEvent.click(
      screen.getByRole("button", { name: "Send recovery link" }),
    );
    expect(authMocks.requestPasswordReset).toHaveBeenCalledWith(
      "person@example.edu",
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If the address belongs to an account",
    );
  });

  it("updates the password when the recovery session is valid", async () => {
    authMocks.getCurrentSession.mockResolvedValue({ user: { id: "user-1" } });
    authMocks.updatePassword.mockResolvedValue(undefined);
    render(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <PasswordPage />
      </MemoryRouter>,
    );
    await screen.findByLabelText("New password");
    await userEvent.type(
      screen.getByLabelText("New password"),
      "NewPassword123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Update password" }),
    );
    expect(authMocks.updatePassword).toHaveBeenCalledWith("NewPassword123");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Password updated",
    );
  });

  it("blocks password updates when the recovery link is expired", async () => {
    authMocks.getCurrentSession.mockResolvedValue(null);
    render(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <PasswordPage />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "invalid or expired",
      ),
    );
    expect(screen.getByLabelText("New password")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Update password" }),
    ).toBeDisabled();
  });
});
