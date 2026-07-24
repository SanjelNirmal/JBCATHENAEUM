const badgeStyles: Record<VerificationBadgeKind, string> = {
  faculty_verified: "bg-emerald-50 text-emerald-800 border-emerald-200",
  moderation_reviewed: "bg-blue-50 text-blue-800 border-blue-200",
  student_contributed: "bg-amber-50 text-amber-900 border-amber-200",
  official_notice: "bg-purple-50 text-purple-800 border-purple-200",
  updated_resource: "bg-slate-100 text-slate-800 border-slate-200",
  popular_resource: "bg-rose-50 text-rose-800 border-rose-200",
};

const badgeLabels: Record<VerificationBadgeKind, string> = {
  faculty_verified: "Faculty Verified",
  moderation_reviewed: "Moderation Reviewed",
  student_contributed: "Student Contributed",
  official_notice: "Official Campus Notice",
  updated_resource: "Updated Resource",
  popular_resource: "Popular Resource",
};

const badgeDescriptions: Record<VerificationBadgeKind, string> = {
  faculty_verified:
    "A faculty reviewer is explicitly recorded as the verifier of this resource.",
  moderation_reviewed:
    "The moderation team checked file safety and academic relevance before publication.",
  student_contributed:
    "This resource was contributed by a student account and approved after review.",
  official_notice:
    "This content is marked as an official campus notice by administrators.",
  updated_resource:
    "This resource has been revised after its original publication date.",
  popular_resource:
    "This resource is currently performing strongly in learner engagement.",
};

export type VerificationBadgeKind =
  | "faculty_verified"
  | "moderation_reviewed"
  | "student_contributed"
  | "official_notice"
  | "updated_resource"
  | "popular_resource";

export function ResourceVerificationBadge({
  kind,
}: {
  kind: VerificationBadgeKind;
}) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-bold ${badgeStyles[kind]}`}
      title={badgeDescriptions[kind]}
      aria-label={`${badgeLabels[kind]}: ${badgeDescriptions[kind]}`}
    >
      {badgeLabels[kind]}
    </span>
  );
}
