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

export function getRoleDescription(role: TeamRole): string {
  switch (role) {
    case "owner":
    case "admin":
      return "Full access to all features, team management, and billing";
    case "member":
      return "Can create and manage merchants, deals, and transactions";
    case "broker":
      return "Can view their originated deals and commissions";
    case "syndicate":
      return "Can view their syndication positions and returns";
    case "merchant":
      return "Can view their deals, payments, and deals";
    case "bookkeeper":
      return "Can reconcile transactions, generate ACH batches, and export reports";
  }
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
