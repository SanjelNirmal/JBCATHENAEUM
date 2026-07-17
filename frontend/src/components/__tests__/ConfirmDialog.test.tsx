import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("has modal semantics, traps focus, and submits the required reason", async () => {
    const confirm = vi.fn();
    const close = vi.fn();
    render(
      <ConfirmDialog
        title="Reject submission"
        description="The contributor will be notified."
        confirmLabel="Reject"
        destructive
        requireReason
        onConfirm={confirm}
        onClose={close}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Reject submission" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    await userEvent.type(
      screen.getByLabelText("Reason"),
      "Missing required citation",
    );
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(confirm).toHaveBeenCalledWith("Missing required citation", "");
  });

  it("closes on Escape", async () => {
    const close = vi.fn();
    render(
      <ConfirmDialog
        title="Archive"
        description="Hide this resource."
        confirmLabel="Archive"
        onConfirm={vi.fn()}
        onClose={close}
      />,
    );
    await userEvent.keyboard("{Escape}");
    expect(close).toHaveBeenCalledOnce();
  });
});
