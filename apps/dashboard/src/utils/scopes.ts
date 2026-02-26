export const RESOURCES = [
  {
    key: "bank-accounts",
    name: "Bank Accounts",
    description: "Access to bank account data",
    scopes: [
      { scope: "bank-accounts.read", type: "read", label: "Read" },
      { scope: "bank-accounts.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "merchants",
    name: "Merchants",
    description: "Access to merchant data",
    scopes: [
      { scope: "merchants.read", type: "read", label: "Read" },
      { scope: "merchants.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "documents",
    name: "Documents",
    description: "Access to document data",
    scopes: [
      { scope: "documents.read", type: "read", label: "Read" },
      { scope: "documents.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "inbox",
    name: "Inbox",
    description: "Access to inbox data",
    scopes: [
      { scope: "inbox.read", type: "read", label: "Read" },
      { scope: "inbox.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "deals",
    name: "Deals",
    description: "Access to deal data",
    scopes: [
      { scope: "deals.read", type: "read", label: "Read" },
      { scope: "deals.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "transactions",
    name: "Transactions",
    description: "Access to transaction data",
    scopes: [
      { scope: "transactions.read", type: "read", label: "Read" },
      { scope: "transactions.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "teams",
    name: "Teams",
    description: "Access to team data",
    scopes: [
      { scope: "teams.read", type: "read", label: "Read" },
      { scope: "teams.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "users",
    name: "Users",
    description: "Access to user data",
    scopes: [
      { scope: "users.read", type: "read", label: "Read" },
      { scope: "users.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "tags",
    name: "Tags",
    description: "Access to tag data",
    scopes: [
      { scope: "tags.read", type: "read", label: "Read" },
      { scope: "tags.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "reports",
    name: "Reports",
    description: "Access to reports data",
    scopes: [{ scope: "reports.read", type: "read", label: "Read" }],
  },
  {
    key: "search",
    name: "Search",
    description: "Access to search functionality",
    scopes: [{ scope: "search.read", type: "read", label: "Read" }],
  },
  {
    key: "notifications",
    name: "Notifications",
    description: "Access to notifications data",
    scopes: [
      { scope: "notifications.read", type: "read", label: "Read" },
      { scope: "notifications.write", type: "write", label: "Write" },
    ],
  },
] as const;

export const getScopeDescription = (scope: string) => {
  // Handle special API-level scopes
  if (scope === "apis.all") {
    return {
      label: "Full access to all resources",
    };
  }

  if (scope === "apis.read") {
    return {
      label: "Read-only access to all resources",
    };
  }

  // Find the resource and scope
  for (const resource of RESOURCES) {
    const foundScope = resource.scopes.find((s) => s.scope === scope);
    if (foundScope) {
      return {
        label: `${foundScope.label} access to ${resource.name}`,
      };
    }
  }

  // Fallback for unknown scopes
  return {
    label: scope,
  };
};
