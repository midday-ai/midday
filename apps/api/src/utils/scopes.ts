export const SCOPES = [
  "transactions.read",
  "transactions.write",
  "apis.all", // All API scopes
  "apis.read", // All read scopes
] as const;

export type Scope = (typeof SCOPES)[number];
