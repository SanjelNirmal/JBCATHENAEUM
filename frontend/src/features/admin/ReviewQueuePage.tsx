import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Check, Eye, Play, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import {
  assignResourceReviewer,
  archiveReviewSubmission,
  claimResourceReview,
  decideResourceReview,
  fetchReviewQueue,
  getReviewFileUrl,
  publishApprovedResource,
  type ReviewQueueItem,
} from "../../lib/supabase/reviews";
import { toSafeErrorMessage } from "../../lib/supabase/errors";
import { fetchUsers } from "../../lib/supabase/profiles";
import { canReviewResources } from "../../lib/roles";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

type Outcome = "approved" | "changes_requested" | "rejected";
type QueueAction = Outcome | "archive";

function isActiveReview(item: ReviewQueueItem) {
  return item.status === "submitted" || item.status === "under_review";
}

function canPreviewReview(item: ReviewQueueItem) {
  return item.scanStatus === "pending" || item.scanStatus === "clean";
}

function reviewStatusLabel(status: string) {
  if (status === "pending") return "Manual review pending";
  if (status === "clean") return "Manually approved";
  return status.replaceAll("_", " ");
}

export default function ReviewQueuePage() {
  const auth = useCurrentAuth();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReviewQueueItem["status"] | "">("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{
    outcome: QueueAction;
    items: ReviewQueueItem[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [assignDialog, setAssignDialog] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const canAssign =
    auth.profile?.role === "admin" || auth.profile?.role === "super_admin";
  const query = useQuery({
    queryKey: ["review-queue", page, status, debouncedSearch],
    queryFn: () =>
      fetchReviewQueue(page, 20, debouncedSearch, status || undefined),
  });
  const reviewersQuery = useQuery({
    queryKey: ["reviewer-options"],
    queryFn: () => fetchUsers("", undefined, "active"),
    enabled: canAssign,
    staleTime: 5 * 60_000,
  });
  const reviewers = (reviewersQuery.data ?? []).filter((user) =>
    user.roles.some(canReviewResources),
  );
  const items = query.data?.items ?? [];
  const chosen = items.filter(
    (item) =>
      isActiveReview(item) &&
      item.submitterId !== auth.user?.id &&
      selected.has(item.submissionId),
  );
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["review-queue"] });
    setSelected(new Set());
  };
  const claim = async (id: string) => {
    setBusy(true);
    try {
      await claimResourceReview(id);
      setMessage("Submission claimed.");
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "review"));
    } finally {
      setBusy(false);
    }
  };
  const preview = async (id: string) => {
    try {
      window.open(await getReviewFileUrl(id), "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "review"));
    }
  };
  const decide = async (reason: string) => {
    if (!dialog) return;
    setBusy(true);
    const failures: string[] = [];
    let completed = 0;
    for (const item of dialog.items) {
      try {
        if (dialog.outcome === "archive") {
          await archiveReviewSubmission(item.submissionId, reason);
        } else {
          if (item.status === "submitted")
            await claimResourceReview(item.submissionId);
          await decideResourceReview(item.submissionId, dialog.outcome, reason);
          if (
            dialog.outcome === "approved" &&
            (auth.profile?.role === "admin" ||
              auth.profile?.role === "super_admin")
          )
            await publishApprovedResource(item.resourceId);
        }
        completed += 1;
      } catch {
        failures.push(item.title);
      }
    }
    setMessage(
      `${completed} of ${dialog.items.length} completed.${failures.length ? ` Failed: ${failures.join(", ")}` : ""}`,
    );
    setBusy(false);
    setDialog(null);
    await refresh();
  };
  const assign = async () => {
    if (!reviewerId || chosen.length === 0) return;
    setBusy(true);
    let completed = 0;
    const failures: string[] = [];
    for (const item of chosen) {
      try {
        await assignResourceReviewer(item.submissionId, reviewerId);
        completed += 1;
      } catch {
        failures.push(item.title);
      }
    }
    setMessage(
      `${completed} of ${chosen.length} assigned.${failures.length ? ` Failed: ${failures.join(", ")}` : ""}`,
    );
    setBusy(false);
    setAssignDialog(false);
    await refresh();
  };
  return (
    <main id="main-content">
      <Seo
        title="Review queue"
        description="Moderate submitted academic resources."
        path="/admin/reviews"
        noIndex
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#002147]">
            Review queue
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Moderators cannot approve their own submissions; the database
            enforces this rule. New uploads remain private until a moderator
            previews and manually approves them. Earlier rejection history
            remains available as read-only records.
          </p>
        </div>
        <button
          onClick={() => void query.refetch()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-bold"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>
      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Search title
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
              setStatus(event.target.value as ReviewQueueItem["status"] | "");
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option value="">All review records</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="changes_requested">Changes requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>
      {message && (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm" role="status">
          {message}
        </p>
      )}
      {chosen.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <strong className="mr-2 text-sm">{chosen.length} selected</strong>
          <button
            onClick={() => setDialog({ outcome: "approved", items: chosen })}
            className="min-h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white"
          >
            Approve
          </button>
          <button
            onClick={() =>
              setDialog({ outcome: "changes_requested", items: chosen })
            }
            className="min-h-10 rounded-lg bg-amber-600 px-4 text-sm font-bold text-white"
          >
            Request changes
          </button>
          <button
            onClick={() => setDialog({ outcome: "rejected", items: chosen })}
            className="min-h-10 rounded-lg bg-red-700 px-4 text-sm font-bold text-white"
          >
            Reject
          </button>
          {canAssign && (
            <button
              onClick={() => setDialog({ outcome: "archive", items: chosen })}
              className="min-h-10 rounded-lg border border-red-300 bg-white px-4 text-sm font-bold text-red-800"
            >
              Archive
            </button>
          )}
          {canAssign && (
            <>
              <label className="ml-auto text-sm font-semibold">
                <span className="sr-only">Reviewer</span>
                <select
                  aria-label="Reviewer"
                  value={reviewerId}
                  onChange={(event) => setReviewerId(event.target.value)}
                  className="min-h-10 rounded-lg border border-blue-300 bg-white px-3"
                >
                  <option value="">Assign reviewer…</option>
                  {reviewers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={!reviewerId || busy}
                onClick={() => setAssignDialog(true)}
                className="min-h-10 rounded-lg border border-blue-700 bg-white px-4 text-sm font-bold text-blue-900 disabled:opacity-40"
              >
                Assign
              </button>
            </>
          )}
        </div>
      )}
      <div className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading review queue" />
        ) : query.isError ? (
          <ErrorState
            message="Review queue could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No matching submissions"
            message={`The review queue is clear. Last refreshed ${new Date().toLocaleTimeString()}.`}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white sm:block">
              <table className="w-full min-w-[94rem] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">
                      <span className="sr-only">Select</span>
                    </th>
                    {[
                      "Submission",
                      "Status",
                      "Contributor",
                      "Program",
                      "Term",
                      "Subject",
                      "Category",
                      "File",
                      "Scan",
                      "Duplicate check",
                      "Review notes",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} scope="col" className="p-3 font-bold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <ReviewRow
                      key={item.submissionId}
                      item={item}
                      ownSubmission={item.submitterId === auth.user?.id}
                      selected={selected.has(item.submissionId)}
                      onSelect={(checked) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          checked
                            ? next.add(item.submissionId)
                            : next.delete(item.submissionId);
                          return next;
                        })
                      }
                      onClaim={() => void claim(item.submissionId)}
                      onPreview={() => void preview(item.versionId)}
                      onDecision={(outcome) =>
                        setDialog({ outcome, items: [item] })
                      }
                      onArchive={
                        canAssign
                          ? () =>
                              setDialog({ outcome: "archive", items: [item] })
                          : undefined
                      }
                      busy={busy}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-4 sm:hidden">
              {items.map((item) => (
                <article
                  key={item.submissionId}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <label className="flex gap-3">
                    <input
                      type="checkbox"
                      disabled={
                        !isActiveReview(item) ||
                        item.submitterId === auth.user?.id
                      }
                      checked={selected.has(item.submissionId)}
                      onChange={(event) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          event.target.checked
                            ? next.add(item.submissionId)
                            : next.delete(item.submissionId);
                          return next;
                        })
                      }
                    />
                    <span>
                      <strong className="block text-[#002147]">
                        {item.title}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {item.contributor} · {item.program} · {item.term}
                      </span>
                    </span>
                  </label>
                  <p className="mt-3 text-sm">
                    {item.status.replace("_", " ")} · {item.subject} ·{" "}
                    {item.category} · {reviewStatusLabel(item.scanStatus)} ·{" "}
                    {item.byteSize
                      ? `${(item.byteSize / 1_048_576).toFixed(1)} MB`
                      : "—"}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Duplicate check:{" "}
                    {item.duplicateWarning ? "warning" : "no exact match"}
                  </p>
                  {item.submitterId === auth.user?.id && (
                    <p className="mt-2 text-sm font-semibold text-amber-800">
                      Your submission requires another reviewer.
                    </p>
                  )}
                  {!isActiveReview(item) && (
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Decision history is read-only.
                    </p>
                  )}
                  {(item.reviewNotes ?? []).length > 0 && (
                    <p className="mt-2 text-sm text-slate-700">
                      Latest note: {item.reviewNotes[0]}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Action
                      label="Preview"
                      icon={Eye}
                      onClick={() => void preview(item.versionId)}
                      disabled={!canPreviewReview(item)}
                    />
                    <Action
                      label="Start review"
                      icon={Play}
                      onClick={() => void claim(item.submissionId)}
                      disabled={
                        busy ||
                        item.status !== "submitted" ||
                        item.submitterId === auth.user?.id
                      }
                    />
                    <Action
                      label="Approve"
                      icon={Check}
                      onClick={() =>
                        setDialog({ outcome: "approved", items: [item] })
                      }
                      disabled={
                        busy ||
                        !isActiveReview(item) ||
                        item.submitterId === auth.user?.id
                      }
                    />
                    <Action
                      label="Changes"
                      icon={RefreshCw}
                      onClick={() =>
                        setDialog({
                          outcome: "changes_requested",
                          items: [item],
                        })
                      }
                      disabled={
                        busy ||
                        !isActiveReview(item) ||
                        item.submitterId === auth.user?.id
                      }
                    />
                    <Action
                      label="Reject"
                      icon={XCircle}
                      onClick={() =>
                        setDialog({ outcome: "rejected", items: [item] })
                      }
                      disabled={
                        busy ||
                        !isActiveReview(item) ||
                        item.submitterId === auth.user?.id
                      }
                    />
                    {canAssign && (
                      <Action
                        label="Archive"
                        icon={Archive}
                        onClick={() =>
                          setDialog({ outcome: "archive", items: [item] })
                        }
                        disabled={busy || !isActiveReview(item)}
                      />
                    )}
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
        <span className="self-center text-sm">Page {page}</span>
        <button
          disabled={items.length < 20}
          onClick={() => setPage((value) => value + 1)}
          className="min-h-11 rounded-lg border border-slate-300 px-5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
      {dialog && (
        <ConfirmDialog
          title={`${dialog.outcome.replace("_", " ")} ${dialog.items.length} submission${dialog.items.length === 1 ? "" : "s"}`}
          description={
            dialog.outcome === "archive"
              ? "Archiving removes the resource from active review and public access. The reason, notification, and action are audited."
              : "This decision is audited and the contributor will be notified. Approval may publish immediately for administrators."
          }
          confirmLabel={
            dialog.outcome === "archive" ? "Archive" : "Apply decision"
          }
          destructive={
            dialog.outcome === "rejected" || dialog.outcome === "archive"
          }
          requireReason={dialog.outcome !== "approved"}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => void decide(reason)}
        />
      )}
      {assignDialog && (
        <ConfirmDialog
          title={`Assign ${chosen.length} submission${chosen.length === 1 ? "" : "s"}`}
          description="The selected reviewer will own these active reviews. Every assignment is authorized server-side and recorded in the audit log."
          confirmLabel="Assign reviewer"
          busy={busy}
          onClose={() => setAssignDialog(false)}
          onConfirm={() => void assign()}
        />
      )}
    </main>
  );
}

function ReviewRow({
  item,
  ownSubmission,
  selected,
  onSelect,
  onClaim,
  onPreview,
  onDecision,
  onArchive,
  busy,
}: {
  item: ReviewQueueItem;
  ownSubmission: boolean;
  selected: boolean;
  onSelect: (value: boolean) => void;
  onClaim: () => void;
  onPreview: () => void;
  onDecision: (outcome: Outcome) => void;
  onArchive?: () => void;
  busy: boolean;
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="p-3">
        <input
          aria-label={`Select ${item.title}`}
          type="checkbox"
          disabled={ownSubmission || !isActiveReview(item)}
          checked={selected}
          onChange={(event) => onSelect(event.target.checked)}
        />
      </td>
      <td className="max-w-64 p-3">
        <strong className="block truncate" title={item.title}>
          {item.title}
        </strong>
        <span className="text-xs text-slate-500">
          {new Date(item.submittedAt).toLocaleDateString()}
        </span>
      </td>
      <td className="p-3">
        <span className="rounded-full border px-2 py-1 text-xs font-bold">
          {item.status.replace("_", " ")}
        </span>
        {!isActiveReview(item) && (
          <span className="mt-2 block text-xs text-slate-500">Read-only</span>
        )}
      </td>
      <td className="p-3">
        <Link to={`/admin/users?q=${item.submitterId}`} className="underline">
          {item.contributor}
        </Link>
        {ownSubmission && (
          <span className="mt-1 block text-xs font-semibold text-amber-800">
            Another reviewer required
          </span>
        )}
      </td>
      <td className="p-3">{item.program}</td>
      <td className="p-3">{item.term}</td>
      <td className="p-3">{item.subject}</td>
      <td className="p-3">{item.category}</td>
      <td className="p-3">
        {item.mimeType}
        <br />
        {item.byteSize ? `${(item.byteSize / 1_048_576).toFixed(1)} MB` : "—"}
      </td>
      <td className="p-3">
        <span className="rounded-full border px-2 py-1 text-xs font-bold">
          {reviewStatusLabel(item.scanStatus)}
        </span>
      </td>
      <td className="p-3">
        <span className="rounded-full border px-2 py-1 text-xs font-bold">
          {item.duplicateWarning ? "Warning" : "No exact match"}
        </span>
      </td>
      <td className="max-w-64 p-3">
        {(item.reviewNotes ?? []).length ? (
          <span className="block truncate" title={item.reviewNotes.join(" · ")}>
            {item.reviewNotes[0]}
          </span>
        ) : (
          <span className="text-slate-500">No notes</span>
        )}
      </td>
      <td className="sticky right-0 bg-white p-3">
        <div className="flex gap-1">
          <Action
            label="Preview"
            icon={Eye}
            onClick={onPreview}
            disabled={!canPreviewReview(item)}
          />
          <Action
            label="Start review"
            icon={Play}
            onClick={onClaim}
            disabled={busy || ownSubmission || item.status !== "submitted"}
          />
          <Action
            label="Approve"
            icon={Check}
            onClick={() => onDecision("approved")}
            disabled={busy || ownSubmission || !isActiveReview(item)}
          />
          <Action
            label="Request changes"
            icon={RefreshCw}
            onClick={() => onDecision("changes_requested")}
            disabled={busy || ownSubmission || !isActiveReview(item)}
          />
          <Action
            label="Reject"
            icon={XCircle}
            onClick={() => onDecision("rejected")}
            disabled={busy || ownSubmission || !isActiveReview(item)}
          />
          {onArchive && (
            <Action
              label="Archive"
              icon={Archive}
              onClick={onArchive}
              disabled={busy || !isActiveReview(item)}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
function Action({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 bg-white disabled:opacity-40"
    >
      <Icon size={16} />
    </button>
  );
}
