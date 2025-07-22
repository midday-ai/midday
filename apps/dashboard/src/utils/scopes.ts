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
    key: "customers",
    name: "Customers",
    description: "Access to customer data",
    scopes: [
      { scope: "customers.read", type: "read", label: "Read" },
      { scope: "customers.write", type: "write", label: "Write" },
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
    key: "invoices",
    name: "Invoices",
    description: "Access to invoice data",
    scopes: [
      { scope: "invoices.read", type: "read", label: "Read" },
      { scope: "invoices.write", type: "write", label: "Write" },
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
    key: "tracker-entries",
    name: "Tracker Entries",
    description: "Access to tracker entry data",
    scopes: [
      { scope: "tracker-entries.read", type: "read", label: "Read" },
      {
        scope: "tracker-entries.write",
        type: "write",
        label: "Write",
      },
    ],
  },
  {
    key: "tracker-projects",
    name: "Tracker Projects",
    description: "Access to tracker project data",
    scopes: [
      { scope: "tracker-projects.read", type: "read", label: "Read" },
      {
        scope: "tracker-projects.write",
        type: "write",
        label: "Write",
      },
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
    key: "metrics",
    name: "Metrics",
    description: "Access to metrics data",
    scopes: [{ scope: "metrics.read", type: "read", label: "Read" }],
  },
  {
    key: "search",
    name: "Search",
    description: "Access to search functionality",
    scopes: [{ scope: "search.read", type: "read", label: "Read" }],
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
