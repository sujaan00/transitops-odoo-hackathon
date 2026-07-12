import { Role, type Role as RoleValue } from "@/lib/domain";

export type Permission =
  | "dashboard:read"
  | "vehicles:read"
  | "vehicles:manage"
  | "drivers:read"
  | "drivers:manage"
  | "trips:read"
  | "trips:manage"
  | "maintenance:read"
  | "maintenance:manage"
  | "finance:read"
  | "finance:manage"
  | "analytics:read"
  | "reports:read"
  | "reports:export"
  | "notifications:read"
  | "users:manage"
  | "settings:read";

const allPermissions: Permission[] = [
  "dashboard:read",
  "vehicles:read",
  "vehicles:manage",
  "drivers:read",
  "drivers:manage",
  "trips:read",
  "trips:manage",
  "maintenance:read",
  "maintenance:manage",
  "finance:read",
  "finance:manage",
  "analytics:read",
  "reports:read",
  "reports:export",
  "notifications:read",
  "users:manage",
  "settings:read"
];

export const rolePermissions: Record<RoleValue, Permission[]> = {
  [Role.ADMIN]: allPermissions,
  [Role.FLEET_MANAGER]: [
    "dashboard:read",
    "vehicles:read",
    "vehicles:manage",
    "maintenance:read",
    "maintenance:manage",
    "analytics:read",
    "reports:read",
    "notifications:read",
    "settings:read"
  ],
  [Role.DISPATCHER]: [
    "dashboard:read",
    "vehicles:read",
    "drivers:read",
    "trips:read",
    "trips:manage",
    "maintenance:read",
    "notifications:read",
    "settings:read"
  ],
  [Role.SAFETY_OFFICER]: [
    "dashboard:read",
    "drivers:read",
    "drivers:manage",
    "trips:read",
    "analytics:read",
    "notifications:read",
    "settings:read"
  ],
  [Role.FINANCIAL_ANALYST]: [
    "dashboard:read",
    "vehicles:read",
    "drivers:read",
    "trips:read",
    "maintenance:read",
    "finance:read",
    "finance:manage",
    "analytics:read",
    "reports:read",
    "reports:export",
    "notifications:read",
    "settings:read"
  ]
};

export function hasPermission(role: RoleValue | undefined, permission: Permission) {
  if (!role) {
    return false;
  }
  return rolePermissions[role].includes(permission);
}
