import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { BuyMeACoffeeModal } from "../BuyMeACoffeeModal";
import { SiteFooter } from "../SiteFooter";

describe("BuyMeACoffeeModal", () => {
  it("makes support optional and does not describe paid access", () => {
    render(<BuyMeACoffeeModal onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Buy Me a Coffee" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-describedby",
      "coffee-modal-description",
    );
    expect(
      screen.getByText(/JBC Athenaeum is free to use/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Access always remains free/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/full document viewing will be unlocked/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/payment required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/24 hours/i)).not.toBeInTheDocument();
  });

  it("closes without requiring payment", async () => {
    const close = vi.fn();
    render(<BuyMeACoffeeModal onClose={close} />);

    await userEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    expect(close).toHaveBeenCalledOnce();
  });

  it("closes on Escape", async () => {
    const close = vi.fn();
    render(<BuyMeACoffeeModal onClose={close} />);

    await userEvent.keyboard("{Escape}");
    expect(close).toHaveBeenCalledOnce();
  });
});

describe("SiteFooter optional support", () => {
  it("opens and dismisses the coffee dialog without navigating", async () => {
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Buy me a coffee/i }),
    );
    expect(
      screen.getByRole("dialog", { name: "Buy Me a Coffee" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    expect(
      screen.queryByRole("dialog", { name: "Buy Me a Coffee" }),
    ).not.toBeInTheDocument();
  });
});
