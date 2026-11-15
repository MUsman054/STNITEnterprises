/**
 * Who can do what in the store admin. One table, used by pages (to hide what a role can't
 * use) and by every Server Action (to refuse it). Safe to import from client components.
 */

export type Role = "customer" | "sales" | "admin" | "owner";
export type StaffRole = Exclude<Role, "customer">;

export type Permission =
  | "orders:view"
  | "orders:edit"
  | "inquiries"
  | "subscribers"
  | "team:view"
  /** Invite, re-role and remove sales staff. */
  | "team:manage-sales"
  /** Invite, re-role and remove admins too. */
  | "team:manage-admins";

const permissions: Record<StaffRole, readonly Permission[]> = {
  sales: ["orders:view", "inquiries"],
  admin: ["orders:view", "orders:edit", "inquiries", "subscribers", "team:view", "team:manage-sales"],
  owner: ["orders:view", "orders:edit", "inquiries", "subscribers", "team:view", "team:manage-sales", "team:manage-admins"],
};

export function isStaff(role: Role): role is StaffRole {
  return role !== "customer";
}

export function can(role: Role, permission: Permission): boolean {
  return isStaff(role) && permissions[role].includes(permission);
}

/** Roles that can be handed out from the website. Owners are only set with `npm run make-admin`. */
export const invitableRoles = ["admin", "sales"] as const;
export type InvitableRole = (typeof invitableRoles)[number];

/** Whether `actor` may invite someone as, change someone to/from, or remove someone with `role`. */
export function canManageRole(actor: Role, role: Role): boolean {
  if (role === "sales") return can(actor, "team:manage-sales");
  if (role === "admin") return can(actor, "team:manage-admins");
  return false; // customers aren't team members; owners are never managed from the website
}

export const roleLabel: Record<Role, string> = {
  customer: "Customer",
  sales: "Sales",
  admin: "Admin",
  owner: "Owner",
};

export const roleDescription: Record<StaffRole, string> = {
  sales: "Views orders and inquiries, and marks inquiries handled.",
  admin: "Full store admin: orders, inquiries, subscribers. Can add and remove sales staff.",
  owner: "Everything, including adding and removing admins.",
};
