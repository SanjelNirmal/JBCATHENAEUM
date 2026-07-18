import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "../../../components/SiteFooter";
import PolicyPage from "../../../pages/PolicyPage";
import PoliciesIndexPage from "../pages/PoliciesIndexPage";
import { legalConfig } from "../config/legalConfig";
import {
  getPolicyBySlug,
  policyDocuments,
  primaryPolicySlugs,
} from "../content/policies";

function renderPolicy(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/policies" element={<PoliciesIndexPage />} />
        <Route path="*" element={<PolicyPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("legal policy pages", () => {
  it.each(primaryPolicySlugs)(
    "renders the %s page with required metadata",
    (slug) => {
      const policy = getPolicyBySlug(slug);
      renderPolicy(policy.path);

      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(
        screen.getByRole("heading", { level: 1, name: policy.title }),
      ).toBeVisible();
      expect(screen.getByText(policy.version)).toBeVisible();
      expect(
        screen.getAllByText(/July 18, 2026/).length,
      ).toBeGreaterThanOrEqual(2);
      expect(
        screen.getByRole("navigation", {
          name: `${policy.title} table of contents`,
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Print policy" }),
      ).toBeVisible();
      expect(
        screen.getByRole("link", { name: "Back to Policies" }),
      ).toHaveAttribute("href", "/policies");
    },
  );

  it("renders the policy index with the five primary policies", () => {
    renderPolicy("/policies");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Policies",
    );
    for (const slug of primaryPolicySlugs) {
      expect(
        screen.getByRole("link", {
          name: new RegExp(getPolicyBySlug(slug).title),
        }),
      ).toHaveAttribute("href", getPolicyBySlug(slug).path);
    }
  });

  it("keeps legal content centralized and free from unsafe placeholder claims", () => {
    const serialized = JSON.stringify({ legalConfig, policyDocuments });

    expect(serialized).not.toContain("localhost");
    expect(serialized).not.toContain("example@example.com");
    expect(serialized).not.toContain("Your Company LLC");
    expect(serialized).not.toContain("123 Main Street");
    expect(serialized).not.toContain("100% legally compliant");
    expect(serialized).not.toContain(
      "all educational use is automatically fair use",
    );
    expect(serialized).toContain(legalConfig.legalContactEmail);
    expect(serialized).toContain("JBC Athenaeum is an independently operated");
    expect(serialized).toContain("qualified legal professional in Nepal");
  });

  it("exposes the requested footer policy links with correct destinations", () => {
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>,
    );

    const policies = screen.getByRole("heading", {
      name: "Policies",
    }).parentElement;
    expect(policies).not.toBeNull();
    const scope = within(policies as HTMLElement);

    expect(
      scope.getByRole("link", { name: "Policy Overview" }),
    ).toHaveAttribute("href", "/policies");
    expect(scope.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(
      scope.getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", "/terms");
    expect(
      scope.getByRole("link", { name: "Copyright Policy" }),
    ).toHaveAttribute("href", "/copyright");
    expect(scope.getByRole("link", { name: "Upload Policy" })).toHaveAttribute(
      "href",
      "/policies/upload",
    );
    expect(
      scope.getByRole("link", { name: "Data Retention Policy" }),
    ).toHaveAttribute("href", "/policies/retention");
  });

  it("renders the retention table in a scrollable region", () => {
    renderPolicy("/policies/retention");

    const table = screen.getByRole("table", {
      name: "Public retention schedule",
    });
    expect(table.parentElement).toHaveClass("overflow-x-auto");
    expect(screen.getByText("Account-deletion requests")).toBeVisible();
  });
});
