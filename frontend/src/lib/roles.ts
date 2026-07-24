export const APP_ROLES = [
  "student",
  "contributor",
  "faculty",
  "moderator",
  "admin",
  "super_admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

const ROLE_PRIORITY: Record<AppRole, number> = {
  student: 0,
  contributor: 1,
  faculty: 2,
  moderator: 3,
  admin: 4,
  super_admin: 5,
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export function resolveEffectiveRole(roles: readonly AppRole[]): AppRole {
  return roles.reduce<AppRole>(
    (effective, role) =>
      ROLE_PRIORITY[role] > ROLE_PRIORITY[effective] ? role : effective,
    "student",
  );
}

export function isAdminRole(role: AppRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function canReviewResources(role: AppRole): boolean {
  return role === "moderator" || isAdminRole(role);
}

export function canManageAcademicPosts(role: AppRole): boolean {
  return (
    role === "faculty" ||
    role === "moderator" ||
    role === "admin" ||
    role === "super_admin"
  );
}
