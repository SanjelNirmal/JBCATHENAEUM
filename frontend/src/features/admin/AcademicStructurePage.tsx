import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import {
  createAcademicEntity,
  fetchAcademicAdminData,
  setAcademicEntityActive,
  slugifyValue,
  type AcademicKind,
} from "../../lib/supabase/academicAdmin";
import { toSafeErrorMessage } from "../../lib/supabase/errors";

const labels: Record<AcademicKind, string> = {
  campuses: "Campuses",
  faculties: "Faculties",
  programs: "Programs",
  curriculum_versions: "Curricula",
  terms: "Terms",
  subjects: "Subjects",
  resource_categories: "Categories",
};

export default function AcademicStructurePage() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<AcademicKind>("subjects");
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["academic-admin"],
    queryFn: fetchAcademicAdminData,
  });
  const data = query.data;
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["academic-admin"] });
  const toggle = async (id: string, active: boolean) => {
    setBusy(true);
    try {
      await setAcademicEntityActive(kind, id, active);
      setMessage(
        `${labels[kind]} record ${active ? "activated" : "deactivated"}.`,
      );
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const values: Record<string, unknown> = {
      name,
      slug: slugifyValue(name),
      is_active: true,
    };
    if (kind === "faculties" || kind === "resource_categories")
      values.campus_id = form.get("campus_id");
    if (kind === "programs") {
      values.campus_id = form.get("campus_id");
      values.faculty_id = form.get("faculty_id");
    }
    if (kind === "curriculum_versions") {
      values.program_id = form.get("program_id");
      values.is_current = false;
      values.effective_year = Number(form.get("effective_year")) || null;
    }
    if (kind === "terms") {
      values.program_id = form.get("program_id");
      values.curriculum_version_id = form.get("curriculum_version_id");
      values.term_number = Number(form.get("term_number")) || null;
    }
    if (kind === "subjects") {
      values.program_id = form.get("program_id");
      values.curriculum_version_id = form.get("curriculum_version_id");
      values.term_id = form.get("term_id");
    }
    try {
      await createAcademicEntity(kind, values);
      setMessage(`${name} created.`);
      setShowCreate(false);
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const rows = data?.[kind] ?? [];
  return (
    <main id="main-content">
      <Seo
        title="Academic structure"
        description="Manage normalized academic records."
        path="/admin/academic-structure"
        noIndex
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#002147]">
            Academic structure
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage normalized campuses, faculties, programs, curricula, terms,
            subjects, and categories.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#002147] px-4 font-bold text-white"
        >
          <Plus size={18} />
          Add record
        </button>
      </div>
      <div
        className="mt-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Academic entity type"
      >
        {(Object.keys(labels) as AcademicKind[]).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={kind === value}
            onClick={() => setKind(value)}
            className={`min-h-10 rounded-lg border px-3 text-sm font-bold ${kind === value ? "border-[#002147] bg-[#002147] text-white" : "border-slate-300 bg-white"}`}
          >
            {labels[value]} {data ? `(${data[value].length})` : ""}
          </button>
        ))}
      </div>
      {message && (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm" role="status">
          {message}
        </p>
      )}
      {showCreate && data && (
        <form
          onSubmit={create}
          className="mt-5 grid gap-4 rounded-xl border border-blue-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm font-semibold">
            Name
            <input
              name="name"
              required
              minLength={2}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          {["faculties", "programs", "resource_categories"].includes(kind) && (
            <ParentSelect
              name="campus_id"
              label="Campus"
              rows={data.campuses}
            />
          )}
          {kind === "programs" && (
            <ParentSelect
              name="faculty_id"
              label="Faculty"
              rows={data.faculties}
            />
          )}
          {["curriculum_versions", "terms", "subjects"].includes(kind) && (
            <ParentSelect
              name="program_id"
              label="Program"
              rows={data.programs}
            />
          )}
          {["terms", "subjects"].includes(kind) && (
            <ParentSelect
              name="curriculum_version_id"
              label="Curriculum"
              rows={data.curriculum_versions}
            />
          )}
          {kind === "subjects" && (
            <ParentSelect name="term_id" label="Term" rows={data.terms} />
          )}
          {kind === "curriculum_versions" && (
            <label className="text-sm font-semibold">
              Effective year
              <input
                name="effective_year"
                type="number"
                min="1959"
                max="2200"
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
          )}
          {kind === "terms" && (
            <label className="text-sm font-semibold">
              Term number
              <input
                name="term_number"
                type="number"
                min="1"
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
          )}
          <div className="flex items-end gap-3">
            <button
              disabled={busy}
              className="min-h-11 rounded-lg bg-[#002147] px-5 font-bold text-white"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="min-h-11 rounded-lg border border-slate-300 px-5 font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading academic structure" />
        ) : query.isError ? (
          <ErrorState
            message="Academic records could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={`No ${labels[kind].toLowerCase()}`}
            message="Create the first record after confirming the academic hierarchy."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="p-3">
                    Name
                  </th>
                  <th scope="col" className="p-3">
                    Slug
                  </th>
                  <th scope="col" className="p-3">
                    Status
                  </th>
                  <th scope="col" className="p-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = String(row.id);
                  const active = row.is_active !== false;
                  return (
                    <tr key={id} className="border-t border-slate-100">
                      <td className="p-3 font-bold">
                        {String(row.name ?? "—")}
                      </td>
                      <td className="p-3">{String(row.slug ?? "—")}</td>
                      <td className="p-3">{active ? "Active" : "Inactive"}</td>
                      <td className="p-3">
                        <button
                          disabled={busy}
                          onClick={() => void toggle(id, !active)}
                          className="min-h-10 rounded-lg border border-slate-300 px-3 font-bold"
                        >
                          {active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
function ParentSelect({
  name,
  label,
  rows,
}: {
  name: string;
  label: string;
  rows: Array<Record<string, unknown>>;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select
        name={name}
        required
        className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {rows.map((row) => (
          <option key={String(row.id)} value={String(row.id)}>
            {String(row.name)}
          </option>
        ))}
      </select>
    </label>
  );
}
