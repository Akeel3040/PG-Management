import { UserRole } from "@prisma/client";

export type PermissionAction =
  | "property:create"
  | "property:read"
  | "property:update"
  | "property:delete"
  | "room:manage"
  | "bed:manage"
  | "tenant:create"
  | "tenant:read"
  | "tenant:update"
  | "tenant:delete"
  | "tenant:checkin"
  | "tenant:checkout"
  | "rent:generate"
  | "rent:view"
  | "payment:create"
  | "payment:view"
  | "expense:manage"
  | "complaint:create"
  | "complaint:manage"
  | "visitor:manage"
  | "staff:manage"
  | "notice:manage"
  | "report:view"
  | "setting:manage"
  | "audit:view";

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    "property:create", "property:read", "property:update", "property:delete",
    "room:manage", "bed:manage", "tenant:create", "tenant:read", "tenant:update", "tenant:delete",
    "tenant:checkin", "tenant:checkout", "rent:generate", "rent:view", "payment:create", "payment:view",
    "expense:manage", "complaint:create", "complaint:manage", "visitor:manage", "staff:manage",
    "notice:manage", "report:view", "setting:manage", "audit:view"
  ],
  OWNER: [
    "property:create", "property:read", "property:update", "property:delete",
    "room:manage", "bed:manage", "tenant:create", "tenant:read", "tenant:update", "tenant:delete",
    "tenant:checkin", "tenant:checkout", "rent:generate", "rent:view", "payment:create", "payment:view",
    "expense:manage", "complaint:create", "complaint:manage", "visitor:manage", "staff:manage",
    "notice:manage", "report:view", "setting:manage", "audit:view"
  ],
  MANAGER: [
    "property:read", "room:manage", "bed:manage",
    "tenant:create", "tenant:read", "tenant:update",
    "tenant:checkin", "tenant:checkout",
    "rent:view", "payment:create", "payment:view",
    "complaint:create", "complaint:manage", "visitor:manage",
    "notice:manage", "report:view"
  ],
  ACCOUNTANT: [
    "property:read", "tenant:read",
    "rent:generate", "rent:view", "payment:create", "payment:view",
    "expense:manage", "report:view"
  ],
  STAFF: [
    "property:read", "room:manage", "bed:manage", "tenant:read",
    "complaint:manage", "visitor:manage"
  ],
  TENANT: [
    "complaint:create"
  ],
};

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action);
}

export function canAccessProperty(
  role: UserRole,
  userAssignedPropertyId: string | null | undefined,
  targetPropertyId: string
): boolean {
  if (role === "SUPER_ADMIN" || role === "OWNER") return true;
  if (!userAssignedPropertyId) return false;
  return userAssignedPropertyId === targetPropertyId;
}
