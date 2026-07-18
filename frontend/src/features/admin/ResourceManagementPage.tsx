import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Download,
  Edit3,
  Eye,
  FileText,
  Flag,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { AccessibleModal } from "../../components/AccessibleModal";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import type {
  AppRole,
  ResourceStatus,
} from "../../lib/supabase/database.types";
import {
  archiveResource,
  bulkResourceState,
  fetchAdminResources,
  fetchResource,
  fetchResourceHistory,
  getAdminResourcePreviewUrl,
  getDownloadUrl,
  permanentlyDeleteResource,
  restoreResource,
  updateResourceMetadata,
  type AdminResourceRow,
  type ResourceCard,
} from "../../lib/supabase/resources";
import { toSafeErrorMessage } from "../../lib/supabase/errors";
import { fetchAcademicCatalog } from "../../lib/supabase/academic";
import { fetchUsers } from "../../lib/supabase/profiles";
import { pageCount } from "../../lib/supabase/pagination";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

export function canPermanentlyDeleteResource(role: AppRole | undefined) {
  return role === "super_admin";
}

export default function ResourceManagementPage() {
  const auth = useCurrentAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ResourceStatus | "">("");
  const [programId, setProgramId] = useState("");
  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [contributorId, setContributorId] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest" | "title" | "popular">(
    "recent",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{
    kind: "archive" | "restore" | "delete";
    items: AdminResourceRow[];
  } | null>(null);
  const [history, setHistory] = useState<{
    title: string;
    rows: Awaited<ReturnType<typeof fetchResourceHistory>>;
  } | null>(null);
  const [editor, setEditor] = useState<ResourceCard | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const query = useQuery({
    queryKey: [
      "admin-resources",
      page,
      pageSize,
      debouncedSearch,
      status,
      programId,
      termId,
      subjectId,
      contributorId,
      createdFrom,
      createdTo,
      sort,
    ],
    queryFn: () =>
      fetchAdminResources(page, pageSize, debouncedSearch, {
        status: status || undefined,
        programId: programId || undefined,
        termId: termId || undefined,
        subjectId: subjectId || undefined,
        contributorId: contributorId || undefined,
        createdFrom: createdFrom
          ? new Date(`${createdFrom}T00:00:00.000Z`).toISOString()
          : undefined,
        createdTo: createdTo
          ? new Date(
              new Date(`${createdTo}T00:00:00.000Z`).getTime() + 86_400_000,
            ).toISOString()
          : undefined,
        sort,
      }),
  });
  const catalogQuery = useQuery({
    queryKey: ["academic-catalog"],
    queryFn: fetchAcademicCatalog,
    staleTime: 10 * 60_000,
  });
  const contributorsQuery = useQuery({
    queryKey: ["admin-resource-contributors"],
    queryFn: () => fetchUsers(""),
    staleTime: 5 * 60_000,
  });
  const items = query.data?.items ?? [];
  const pages = pageCount(query.data?.total ?? 0, pageSize);
  const programs = Array.from(
    new Map(
      (catalogQuery.data ?? []).map((item) => [item.programId, item]),
    ).values(),
  );
  const terms = Array.from(
    new Map(
      (catalogQuery.data ?? [])
        .filter((item) => !programId || item.programId === programId)
        .map((item) => [item.termId, item]),
    ).values(),
  );
  const subjects = (catalogQuery.data ?? []).filter(
    (item) =>
      (!programId || item.programId === programId) &&
      (!termId || item.termId === termId),
  );
  const chosen = items.filter((item) => selected.has(item.id));
  const refresh = async () => {
    setSelected(new Set());
    await queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
  };
  const runSingle = async (
    item: AdminResourceRow,
    action: "archive" | "restore",
  ) => {
    setBusy(true);
    try {
      action === "archive"
        ? await archiveResource(item.id)
        : await restoreResource(item.id);
      setMessage(
        `${item.title} ${action === "archive" ? "archived" : "restored"}.`,
      );
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "resource"));
    } finally {
      setBusy(false);
    }
  };
  const confirm = async (reason: string, confirmation: string) => {
    if (!dialog) return;
    setBusy(true);
    try {
      if (dialog.kind === "delete") {
        const item = dialog.items[0];
        const result = await permanentlyDeleteResource(item.id, confirmation);
        setMessage(
          result.cleanupPending
            ? "Resource deleted. Private storage cleanup is queued for retry."
            : "Resource and managed storage permanently deleted.",
        );
      } else if (dialog.items.length === 1)
        await runSingle(dialog.items[0], dialog.kind);
      else {
        const result = await bulkResourceState(
          dialog.items.map((item) => item.id),
          dialog.kind,
          reason,
        );
        setMessage(`Bulk ${dialog.kind} completed: ${JSON.stringify(result)}.`);
      }
      setDialog(null);
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "resource"));
      setBusy(false);
    }
  };
  const showHistory = async (item: AdminResourceRow) => {
    try {
      setHistory({
        title: item.title,
        rows: await fetchResourceHistory(item.id),
      });
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "resource"));
    }
  };
  const showEditor = async (item: AdminResourceRow) => {
    try {
      const detail = await fetchResource(item.id);
      if (!detail) throw new Error("not_found");
      setEditor(detail);
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "resource"));
    }
  };
  const preview = async (item: AdminResourceRow) => {
    try {
      window.open(
        await getAdminResourcePreviewUrl(item.id),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "resource"));
    }
  };
  const saveMetadata = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await updateResourceMetadata(
        editor.id,
        String(form.get("title")),
        String(form.get("description")),
        editor.categoryId,
        Number(form.get("academicYear")),
      );
      setMessage("Resource metadata updated.");
      setEditor(null);
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "resource"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="main-content">
      <Seo
        title="Resource management"
        description="Manage archive resources."
        path="/admin/resources"
        noIndex
      />
      <h1 className="font-serif text-3xl font-bold text-[#002147]">
        Resource management
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Soft archive is the default. Super Admins can permanently delete any
        resource after two-factor and exact-text confirmation.
      </p>
      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-semibold">
          Search
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ResourceStatus | "");
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option value="">All statuses</option>
            {[
              "draft",
              "submitted",
              "under_review",
              "changes_requested",
              "approved",
              "published",
              "rejected",
              "archived",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Page size
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option>20</option>
            <option>50</option>
          </select>
        </label>
        <AdminSelect
          label="Program"
          value={programId}
          onChange={(value) => {
            setProgramId(value);
            setTermId("");
            setSubjectId("");
            setPage(1);
          }}
          options={programs.map((item) => [item.programId, item.programName])}
        />
        <AdminSelect
          label="Term"
          value={termId}
          onChange={(value) => {
            setTermId(value);
            setSubjectId("");
            setPage(1);
          }}
          options={terms.map((item) => [item.termId, item.termName])}
        />
        <AdminSelect
          label="Subject"
          value={subjectId}
          onChange={(value) => {
            setSubjectId(value);
            setPage(1);
          }}
          options={subjects.map((item) => [item.subjectId, item.subjectName])}
        />
        <AdminSelect
          label="Contributor"
          value={contributorId}
          onChange={(value) => {
            setContributorId(value);
            setPage(1);
          }}
          options={(contributorsQuery.data ?? []).map((item) => [
            item.id,
            item.name,
          ])}
        />
        <label className="text-sm font-semibold">
          Created from
          <input
            type="date"
            value={createdFrom}
            onChange={(event) => {
              setCreatedFrom(event.target.value);
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Created through
          <input
            type="date"
            value={createdTo}
            onChange={(event) => {
              setCreatedTo(event.target.value);
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
        <AdminSelect
          label="Sort"
          value={sort}
          onChange={(value) => {
            setSort(value as typeof sort);
            setPage(1);
          }}
          includeAll={false}
          options={[
            ["recent", "Recently added"],
            ["oldest", "Oldest"],
            ["title", "Title"],
            ["popular", "Downloads"],
          ]}
        />
      </div>
      {message && (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm" role="status">
          {message}
        </p>
      )}
      <p className="mt-4 text-sm font-semibold text-slate-600">
        {(query.data?.total ?? 0).toLocaleString()} matching resources · page{" "}
        {page} of {pages}
      </p>
      {chosen.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-blue-50 p-3">
          <strong className="mr-2 text-sm">{chosen.length} selected</strong>
          <button
            onClick={() => setDialog({ kind: "archive", items: chosen })}
            className="min-h-10 rounded-lg bg-red-700 px-4 text-sm font-bold text-white"
          >
            Archive selected
          </button>
          <button
            onClick={() => setDialog({ kind: "restore", items: chosen })}
            className="min-h-10 rounded-lg bg-[#002147] px-4 text-sm font-bold text-white"
          >
            Restore selected
          </button>
        </div>
      )}
      <div className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading resources" />
        ) : query.isError ? (
          <ErrorState
            message="Resources could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No matching resources"
            message="Change the search or status filter."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white sm:block">
              <table className="w-full min-w-[65rem] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">
                      <span className="sr-only">Select</span>
                    </th>
                    {[
                      "Title",
                      "Status",
                      "Program",
                      "Term",
                      "Subject",
                      "Created",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} scope="col" className="p-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.title}`}
                          checked={selected.has(item.id)}
                          onChange={(event) =>
                            setSelected((current) => {
                              const next = new Set(current);
                              event.target.checked
                                ? next.add(item.id)
                                : next.delete(item.id);
                              return next;
                            })
                          }
                        />
                      </td>
                      <td className="max-w-72 p-3">
                        <span
                          className="block truncate font-bold"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full border px-2 py-1 text-xs font-bold">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3">{item.program}</td>
                      <td className="p-3">{item.term}</td>
                      <td className="p-3">{item.subject}</td>
                      <td className="p-3">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="sticky right-0 bg-white p-3">
                        <ResourceActions
                          item={item}
                          busy={busy}
                          superAdmin={canPermanentlyDeleteResource(
                            auth.profile?.role,
                          )}
                          edit={() => void showEditor(item)}
                          preview={() => void preview(item)}
                          archive={() =>
                            setDialog({ kind: "archive", items: [item] })
                          }
                          restore={() =>
                            setDialog({ kind: "restore", items: [item] })
                          }
                          history={() => void showHistory(item)}
                          remove={() =>
                            setDialog({ kind: "delete", items: [item] })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-4 sm:hidden">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={(event) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          event.target.checked
                            ? next.add(item.id)
                            : next.delete(item.id);
                          return next;
                        })
                      }
                    />
                    <span>
                      <strong className="block text-[#002147]">
                        {item.title}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {item.status} · {item.program} · {item.term}
                      </span>
                    </span>
                  </label>
                  <div className="mt-4">
                    <ResourceActions
                      item={item}
                      busy={busy}
                      superAdmin={auth.profile?.role === "super_admin"}
                      edit={() => void showEditor(item)}
                      preview={() => void preview(item)}
                      archive={() =>
                        setDialog({ kind: "archive", items: [item] })
                      }
                      restore={() =>
                        setDialog({ kind: "restore", items: [item] })
                      }
                      history={() => void showHistory(item)}
                      remove={() =>
                        setDialog({ kind: "delete", items: [item] })
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage((value) => value - 1)}
          className="min-h-11 rounded-lg border border-slate-300 px-5 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="self-center text-sm">
          Page {page} of {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage((value) => value + 1)}
          className="min-h-11 rounded-lg border border-slate-300 px-5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
      {editor && (
        <AccessibleModal
          labelledBy="metadata-title"
          onClose={() => {
            if (!busy) setEditor(null);
          }}
          closeOnBackdrop={!busy}
        >
          <form onSubmit={saveMetadata} className="space-y-5">
            <h2
              id="metadata-title"
              className="font-serif text-2xl font-bold text-[#002147]"
            >
              Edit resource metadata
            </h2>
            <label className="block text-sm font-semibold">
              Title
              <input
                name="title"
                defaultValue={editor.title}
                required
                minLength={3}
                maxLength={240}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Description
              <textarea
                name="description"
                defaultValue={editor.description ?? ""}
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Academic year
              <input
                name="academicYear"
                type="number"
                min="1959"
                max="2200"
                defaultValue={editor.academicYear ?? new Date().getFullYear()}
                required
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
            <p className="text-xs text-slate-500">
              Category: {editor.categoryName}. Academic hierarchy changes must
              be made through a reviewed resubmission.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="min-h-11 rounded-lg border border-slate-300 px-5 font-bold"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="min-h-11 rounded-lg bg-[#002147] px-5 font-bold text-white"
              >
                Save metadata
              </button>
            </div>
          </form>
        </AccessibleModal>
      )}
      {history && (
        <AccessibleModal
          label={`Version history for ${history.title}`}
          onClose={() => setHistory(null)}
          className="max-w-2xl"
        >
          <h2 className="font-serif text-2xl font-bold text-[#002147]">
            Version history
          </h2>
          <p className="mt-1 text-sm text-slate-600">{history.title}</p>
          <ul className="mt-5 space-y-3">
            {history.rows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-slate-200 p-3 text-sm"
              >
                Version {row.version_number} · {row.scan_status} ·{" "}
                {row.byte_size
                  ? `${(row.byte_size / 1_048_576).toFixed(1)} MB`
                  : "—"}{" "}
                · {new Date(row.created_at).toLocaleString()}
                {row.is_current && " · Current"}
                {row.failure_code && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-950">
                    <strong className="block">Upload failure reason</strong>
                    <span>{formatFailureCode(row.failure_code)}</span>
                  </div>
                )}
                {JSON.stringify(row.scan_result) !== "{}" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer font-semibold text-slate-700">
                      Upload processing details
                    </summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                      {JSON.stringify(row.scan_result, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setHistory(null)}
            className="mt-5 min-h-11 rounded-lg bg-[#002147] px-5 font-bold text-white"
          >
            Close
          </button>
        </AccessibleModal>
      )}
      {dialog && (
        <ConfirmDialog
          title={`${dialog.kind} ${dialog.items.length} resource${dialog.items.length === 1 ? "" : "s"}`}
          description={
            dialog.kind === "delete"
              ? "This immediately removes the resource, its database records, ratings, bookmarks, reviews, and managed PDF files. It cannot be undone."
              : "This action is audited. Archiving hides a resource from public access; restoring re-enables the previous valid state."
          }
          confirmLabel={
            dialog.kind === "delete"
              ? "Permanently delete"
              : dialog.kind === "archive"
                ? "Archive"
                : "Restore"
          }
          destructive={dialog.kind !== "restore"}
          requireReason={dialog.kind !== "delete"}
          confirmationText={
            dialog.kind === "delete"
              ? `DELETE ${dialog.items[0].id}`
              : undefined
          }
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={(reason, confirmation) =>
            void confirm(reason, confirmation)
          }
        />
      )}
    </main>
  );
}

function AdminSelect({
  label,
  value,
  onChange,
  options,
  includeAll = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  includeAll?: boolean;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
      >
        {includeAll && <option value="">All</option>}
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResourceActions({
  item,
  busy,
  superAdmin,
  edit,
  preview,
  archive,
  restore,
  history,
  remove,
}: {
  item: AdminResourceRow;
  busy: boolean;
  superAdmin: boolean;
  edit: () => void;
  preview: () => void;
  archive: () => void;
  restore: () => void;
  history: () => void;
  remove: () => void;
}) {
  const actions = [
    { label: "View", icon: Eye, to: `/resources/${item.id}` },
    { label: "Preview", icon: FileText, click: preview },
    { label: "Download", icon: Download, href: getDownloadUrl(item.id) },
    {
      label: "View reports",
      icon: Flag,
      to: `/admin/reports?resource=${item.id}`,
    },
    { label: "History", icon: History, click: history },
    item.status === "archived"
      ? { label: "Restore", icon: RotateCcw, click: restore }
      : { label: "Archive", icon: Archive, click: archive },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {actions.map((action) =>
        action.to ? (
          <Link
            key={action.label}
            to={action.to}
            title={action.label}
            aria-label={action.label}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300"
          >
            <action.icon size={16} />
          </Link>
        ) : action.href ? (
          <a
            key={action.label}
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            title={action.label}
            aria-label={action.label}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300"
          >
            <action.icon size={16} />
          </a>
        ) : (
          <button
            key={action.label}
            onClick={action.click}
            disabled={busy}
            title={action.label}
            aria-label={action.label}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40"
          >
            <action.icon size={16} />
          </button>
        ),
      )}
      <button
        onClick={edit}
        title="Edit metadata"
        aria-label="Edit metadata"
        disabled={busy}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40"
      >
        <Edit3 size={16} />
      </button>
      {superAdmin && (
        <button
          onClick={remove}
          title="Permanently delete"
          aria-label="Permanently delete"
          disabled={busy}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-red-300 text-red-700 disabled:opacity-40"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function formatFailureCode(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
