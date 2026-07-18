import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ContributeView } from "../ContributeView";

const api = vi.hoisted(() => ({
  cancelResourceUpload: vi.fn(),
  clearContributionDraft: vi.fn(),
  createUploadSession: vi.fn(),
  fetchAcademicCatalog: vi.fn(),
  fetchContributorSubmissions: vi.fn(),
  finalizeResourceUpload: vi.fn(),
  loadContributionDraft: vi.fn(),
  saveContributionDraft: vi.fn(),
  uploadPdfWithProgress: vi.fn(),
}));
vi.mock("../../lib/api", () => api);

const catalog = [
  {
    campusId: "campus",
    campusName: "Jana Bhawana Campus",
    campusSlug: "jbc",
    facultyId: "faculty",
    facultyName: "Management",
    facultySlug: "management",
    programId: "program",
    programName: "BBS",
    programSlug: "bbs",
    curriculumVersionId: "curriculum",
    curriculumName: "Current",
    curriculumIsCurrent: true,
    termId: "term",
    termName: "First semester",
    termSlug: "first",
    subjectId: "subject",
    subjectName: "Economics",
    subjectSlug: "economics",
    categories: [{ id: "category", name: "Notes", slug: "notes" }],
  },
];

function renderContributeView(props: ComponentProps<typeof ContributeView>) {
  return render(
    <MemoryRouter>
      <ContributeView {...props} />
    </MemoryRouter>,
  );
}

describe("ContributeView", () => {
  it("shows every program and term returned by the academic catalog", async () => {
    const bcaFirst = {
      ...catalog[0],
      facultyId: "fohss",
      facultyName: "Faculty of Humanities and Social Sciences",
      facultySlug: "humanities-and-social-sciences",
      programId: "bca",
      programName: "BCA",
      programSlug: "bca",
      termId: "bca-1",
      termName: "1st Semester",
      termSlug: "1st-semester",
      subjectId: "bca-101",
      subjectName: "Computer Fundamentals and Applications",
      subjectSlug: "computer-fundamentals-and-applications",
    };
    const bcaFourth = {
      ...bcaFirst,
      termId: "bca-4",
      termName: "4th Semester",
      termSlug: "4th-semester",
      subjectId: "bca-251",
      subjectName: "Operating Systems",
      subjectSlug: "operating-systems",
    };
    api.fetchAcademicCatalog.mockResolvedValue([
      bcaFirst,
      bcaFourth,
      catalog[0],
    ]);
    api.fetchContributorSubmissions.mockResolvedValue([]);
    api.loadContributionDraft.mockReturnValue(null);

    renderContributeView({
      isAuthenticated: true,
      emailVerified: true,
      initialName: "Student",
    });

    const program = await screen.findByLabelText("Program");
    expect(within(program).getAllByRole("option")).toHaveLength(2);
    expect(within(program).getByRole("option", { name: "BCA" })).toBeVisible();
    expect(within(program).getByRole("option", { name: "BBS" })).toBeVisible();

    const term = screen.getByLabelText("Term");
    expect(within(term).getAllByRole("option")).toHaveLength(2);
    expect(
      within(term).getByRole("option", { name: "1st Semester" }),
    ).toBeVisible();
    expect(
      within(term).getByRole("option", { name: "4th Semester" }),
    ).toBeVisible();

    await userEvent.selectOptions(program, "program");
    expect(within(term).getAllByRole("option")).toHaveLength(1);
    expect(
      within(term).getByRole("option", { name: "First semester" }),
    ).toBeVisible();
  });

  it("rejects non-PDF files before upload", async () => {
    const user = userEvent.setup({ applyAccept: false });
    api.fetchAcademicCatalog.mockResolvedValue(catalog);
    api.fetchContributorSubmissions.mockResolvedValue([]);
    api.loadContributionDraft.mockReturnValue(null);
    renderContributeView({
      isAuthenticated: true,
      emailVerified: true,
      initialName: "Student",
    });
    const input = await screen.findByLabelText("PDF document");
    await user.upload(
      input,
      new File(["not a pdf"], "notes.txt", { type: "text/plain" }),
    );
    expect(
      screen.getByText(/Only files with a .pdf extension/),
    ).toBeInTheDocument();
    expect(api.createUploadSession).not.toHaveBeenCalled();
  });

  it("separates old and new BCA subjects by syllabus", async () => {
    const newSubject = {
      ...catalog[0],
      programId: "bca",
      programName: "BCA",
      programSlug: "bca",
      curriculumVersionId: "bca-new",
      curriculumName: "New BCA syllabus (2025)",
      curriculumIsCurrent: true,
      termId: "new-fourth",
      termName: "4th Semester",
      subjectId: "new-python",
      subjectName: "Python Programming",
    };
    const oldSubject = {
      ...newSubject,
      curriculumVersionId: "bca-old",
      curriculumName: "Old BCA syllabus (currently studied)",
      curriculumIsCurrent: false,
      termId: "old-fourth",
      subjectId: "old-scripting",
      subjectName: "Scripting Language",
    };
    api.fetchAcademicCatalog.mockResolvedValue([newSubject, oldSubject]);
    api.fetchContributorSubmissions.mockResolvedValue([]);
    api.loadContributionDraft.mockReturnValue(null);

    renderContributeView({
      isAuthenticated: true,
      emailVerified: true,
      initialName: "Student",
    });

    const syllabus = await screen.findByLabelText("Syllabus");
    expect(
      within(syllabus).getByRole("option", {
        name: "New BCA syllabus (2025)",
      }),
    ).toBeVisible();
    expect(
      within(syllabus).getByRole("option", {
        name: "Old BCA syllabus (currently studied)",
      }),
    ).toBeVisible();

    expect(
      screen.getByRole("option", { name: "Python Programming" }),
    ).toBeVisible();
    await userEvent.selectOptions(syllabus, "bca-old");
    expect(
      screen.getByRole("option", { name: "Scripting Language" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("option", { name: "Python Programming" }),
    ).not.toBeInTheDocument();
  });

  it("accepts a PDF when the browser reports a generic MIME type", async () => {
    const user = userEvent.setup({ applyAccept: false });
    api.fetchAcademicCatalog.mockResolvedValue(catalog);
    api.fetchContributorSubmissions.mockResolvedValue([]);
    api.loadContributionDraft.mockReturnValue(null);
    api.createUploadSession.mockResolvedValue({
      sessionId: "generic-mime-session",
      signedUrl: "https://upload.invalid",
    });
    api.uploadPdfWithProgress.mockReturnValue({
      promise: Promise.resolve(),
      abort: vi.fn(),
    });
    api.finalizeResourceUpload.mockResolvedValue({
      submissionId: "submission",
      status: "submitted",
    });

    renderContributeView({
      isAuthenticated: true,
      emailVerified: true,
      initialName: "Student",
    });
    await user.type(
      await screen.findByLabelText("Resource title"),
      "Economics notes",
    );
    await user.type(
      screen.getByLabelText("Description"),
      "A complete set of lecture notes.",
    );
    await user.upload(
      screen.getByLabelText("PDF document"),
      new File(["%PDF-1.7"], "phone-upload.pdf", {
        type: "application/octet-stream",
      }),
    );
    await user.click(screen.getByRole("checkbox", { name: /I confirm/ }));
    await user.click(screen.getByRole("button", { name: "Upload PDF" }));

    expect(api.createUploadSession).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        name: "phone-upload.pdf",
        type: "application/pdf",
      }),
    );
  });

  it("shows upload progress and a disabled mutation state", async () => {
    api.fetchAcademicCatalog.mockResolvedValue(catalog);
    api.fetchContributorSubmissions.mockResolvedValue([]);
    api.loadContributionDraft.mockReturnValue(null);
    api.createUploadSession.mockResolvedValue({
      sessionId: "session",
      signedUrl: "https://upload.invalid",
    });
    api.uploadPdfWithProgress.mockImplementation((_url, _file, progress) => {
      progress(55);
      return { promise: new Promise(() => undefined), abort: vi.fn() };
    });
    renderContributeView({
      isAuthenticated: true,
      emailVerified: true,
      initialName: "Student",
    });
    await userEvent.type(
      await screen.findByLabelText("Resource title"),
      "Economics notes",
    );
    await userEvent.type(
      screen.getByLabelText("Description"),
      "A complete set of lecture notes.",
    );
    await userEvent.upload(
      screen.getByLabelText("PDF document"),
      new File(["%PDF-1.7"], "notes.pdf", { type: "application/pdf" }),
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /I confirm/ }));
    await userEvent.click(screen.getByRole("button", { name: "Upload PDF" }));
    expect(await screen.findByText("55%")).toBeInTheDocument();
    expect(api.createUploadSession).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedUploadPolicySlug: "upload",
        acceptedUploadPolicyVersion: "1.0",
      }),
      expect.any(File),
    );
    expect(screen.getByRole("button", { name: /Upload PDF/ })).toBeDisabled();
  });

  it("keeps upload disabled until the declaration is accepted", async () => {
    api.fetchAcademicCatalog.mockResolvedValue(catalog);
    api.fetchContributorSubmissions.mockResolvedValue([]);
    api.loadContributionDraft.mockReturnValue(null);
    renderContributeView({
      isAuthenticated: true,
      emailVerified: true,
      initialName: "Student",
    });

    expect(await screen.findByLabelText("Resource title")).toBeVisible();
    expect(screen.getByRole("button", { name: "Upload PDF" })).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /I confirm/ }));
    expect(screen.getByRole("button", { name: "Upload PDF" })).toBeEnabled();
  });
});
