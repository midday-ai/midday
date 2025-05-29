export const SCOPES = [
  "bank-accounts.read",
  "bank-accounts.write",
  "customers.read",
  "customers.write",
  "documents.read",
  "documents.write",
  "inbox.read",
  "inbox.write",
  "invoices.read",
  "invoices.write",
  "metrics.read",
  "search.read",
  "tags.read",
  "tags.write",
  "teams.read",
  "teams.write",
  "tracker-entries.read",
  "tracker-entries.write",
  "tracker-projects.read",
  "tracker-projects.write",
  "transactions.read",
  "transactions.write",
  "users.read",
  "users.write",
  "apis.all", // All API scopes
  "apis.read", // All read scopes
] as const;

export type Scope = (typeof SCOPES)[number];
export type ScopePreset = "all_access" | "read_only" | "restricted";

export const scopePresets = [
  {
    value: "all_access",
    label: "All",
    description: "full access to all resources",
  },
  {
    value: "read_only",
    label: "Read Only",
    description: "read-only access to all resources",
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "restricted access to some resources",
  },
];

export const scopesToName = (scopes: string[]) => {
  if (scopes.includes("apis.all")) {
    return {
      name: "All access",
      description: "full access to all resources",
      preset: "all_access",
    };
  }

  if (scopes.includes("apis.read")) {
    return {
      name: "Read-only",
      description: "read-only access to all resources",
      preset: "read_only",
    };
  }

  return {
    name: "Restricted",
    description: "restricted access to some resources",
    preset: "restricted",
  };
};

export const expandScopes = (scopes: string[]): string[] => {
  if (scopes.includes("apis.all")) {
    // Return all scopes except any that start with "apis."
    return SCOPES.filter((scope) => !scope.startsWith("apis."));
  }

  if (scopes.includes("apis.read")) {
    // Return all read scopes except any that start with "apis."
    return SCOPES.filter(
      (scope) => scope.endsWith(".read") && !scope.startsWith("apis."),
    );
  }

  // For custom scopes, filter out any "apis." scopes
  return scopes.filter((scope) => !scope.startsWith("apis."));
};
