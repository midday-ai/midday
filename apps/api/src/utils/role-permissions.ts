import type { Scope } from "./scopes";

export const TEAM_ROLES = [
  "owner",
  "admin",
  "member",
  "broker",
  "syndicate",
  "merchant",
  "bookkeeper",
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export const INTERNAL_ROLES: TeamRole[] = ["owner", "admin", "member"];
export const EXTERNAL_ROLES: TeamRole[] = [
  "broker",
  "syndicate",
  "merchant",
  "bookkeeper",
];

export function isInternalRole(role: TeamRole): boolean {
  return INTERNAL_ROLES.includes(role);
}

export function isExternalRole(role: TeamRole): boolean {
  return EXTERNAL_ROLES.includes(role);
}

const ROLE_HIERARCHY: Record<TeamRole, number> = {
  merchant: 0,
  syndicate: 0,
  broker: 0,
  bookkeeper: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/**
 * Maps a role to the scopes it is allowed.
 * Internal roles get broad access; external roles get read-only on their data.
 */
export function getScopesForRole(role: TeamRole): Scope[] {
  switch (role) {
    case "owner":
    case "admin":
      return [
        "bank-accounts.read",
        "bank-accounts.write",
        "chat.read",
        "chat.write",
        "merchants.read",
        "merchants.write",
        "documents.read",
        "documents.write",
        "inbox.read",
        "inbox.write",
        "invoices.read",
        "invoices.write",
        "reports.read",
        "search.read",
        "tags.read",
        "tags.write",
        "teams.read",
        "teams.write",
        "transactions.read",
        "transactions.write",
        "users.read",
        "users.write",
        "notifications.read",
        "notifications.write",
        "reconciliation.read",
        "reconciliation.write",
        "ach.read",
        "ach.write",
        "exports.read",
        "exports.write",
      ];

    case "member":
      return [
        "bank-accounts.read",
        "chat.read",
        "chat.write",
        "merchants.read",
        "merchants.write",
        "documents.read",
        "documents.write",
        "inbox.read",
        "inbox.write",
        "invoices.read",
        "invoices.write",
        "reports.read",
        "search.read",
        "tags.read",
        "tags.write",
        "teams.read",
        "transactions.read",
        "transactions.write",
        "users.read",
        "notifications.read",
        "notifications.write",
        "reconciliation.read",
        "reconciliation.write",
        "ach.read",
        "ach.write",
        "exports.read",
        "exports.write",
      ];

    case "bookkeeper":
      return [
        "bank-accounts.read",
        "transactions.read",
        "transactions.write",
        "merchants.read",
        "invoices.read",
        "teams.read",
        "users.read",
        "search.read",
        "reconciliation.read",
        "reconciliation.write",
        "ach.read",
        "ach.write",
        "exports.read",
        "exports.write",
      ];

    case "broker":
      return [
        "invoices.read",
        "merchants.read",
        "search.read",
        "teams.read",
        "users.read",
      ];

    case "syndicate":
      return [
        "invoices.read",
        "merchants.read",
        "search.read",
        "teams.read",
        "users.read",
      ];

    case "merchant":
      return [
        "invoices.read",
        "transactions.read",
        "teams.read",
        "users.read",
      ];
  }
}

/**
 * Whether the actor's role outranks the target's role.
 * Only internal roles have hierarchy; external roles cannot manage anyone.
 */
export function canManageRole(
  actorRole: TeamRole,
  targetRole: TeamRole,
): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Roles that the given role is allowed to assign when inviting or changing roles.
 */
export function getAssignableRoles(actorRole: TeamRole): TeamRole[] {
  switch (actorRole) {
    case "owner":
      return [
        "owner",
        "admin",
        "member",
        "broker",
        "syndicate",
        "merchant",
        "bookkeeper",
      ];
    case "admin":
      return [
        "admin",
        "member",
        "broker",
        "syndicate",
        "merchant",
        "bookkeeper",
      ];
    default:
      return [];
  }
}

/**
 * Human-readable name shown in the UI.
 * "owner" is displayed as "Admin" to users since it behaves identically.
 */
export function getRoleDisplayName(role: TeamRole): string {
  switch (role) {
    case "owner":
      return "Admin";
    case "admin":
      return "Admin";
    case "member":
      return "Team Member";
    case "broker":
      return "Broker";
    case "syndicate":
      return "Syndicate";
    case "merchant":
      return "Merchant";
    case "bookkeeper":
      return "Bookkeeper";
  }
}
