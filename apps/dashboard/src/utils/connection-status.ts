import type { RouterOutputs } from "@api/trpc/routers/_app";
import { differenceInDays } from "date-fns";

const DISPLAY_DAYS = 30;
const WARNING_DAYS = 14;
const ERROR_DAYS = 7;

// Type from unified connectionStatus endpoint
type ConnectionStatusData = RouterOutputs["team"]["connectionStatus"];

// Legacy types for backward compatibility
type BankConnection = NonNullable<
  RouterOutputs["bankConnections"]["get"]
>[number];
type InboxAccount = NonNullable<RouterOutputs["inboxAccounts"]["get"]>[number];

/**
 * Unified connection issue type for both bank and inbox connections
 */
export type ConnectionIssue = {
  type: "bank" | "inbox";
  severity: "error" | "warning";
  title: string;
  message: string;
  path: string;
  linkText: string;
  // For bank connections
  logoUrl?: string | null;
  // For inbox accounts
  provider?: "gmail" | "outlook";
};

/**
 * Get all connection issues from bank connections
 */
export function getBankIssues(
  connections: BankConnection[] | undefined,
): ConnectionIssue[] {
  if (!connections) return [];

  const issues: ConnectionIssue[] = [];

  for (const connection of connections) {
    // Disconnected bank
    if (connection.status === "disconnected") {
      issues.push({
        type: "bank",
        severity: "error",
        title: connection.name || "Bank account",
        message: "Connection lost",
        path: "/settings/accounts",
        linkText: "Reconnect",
      });
      continue;
    }

    // Check expiration status
    if (connection.expiresAt) {
      const daysUntilExpiry = differenceInDays(
        new Date(connection.expiresAt),
        new Date(),
      );

      if (daysUntilExpiry <= 0) {
        // Expired
        issues.push({
          type: "bank",
          severity: "error",
          title: connection.name || "Bank account",
          message: "Connection expired",
          path: "/settings/accounts",
          linkText: "Reconnect",
        });
      } else if (daysUntilExpiry <= ERROR_DAYS) {
        // Expiring very soon (within 7 days)
        issues.push({
          type: "bank",
          severity: "error",
          title: connection.name || "Bank account",
          message: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`,
          path: "/settings/accounts",
          linkText: "Renew",
        });
      } else if (daysUntilExpiry <= WARNING_DAYS) {
        // Expiring soon (within 14 days)
        issues.push({
          type: "bank",
          severity: "warning",
          title: connection.name || "Bank account",
          message: `Expires in ${daysUntilExpiry} days`,
          path: "/settings/accounts",
          linkText: "Renew",
        });
      }
    }
  }

  return issues;
}

/**
 * Get all connection issues from inbox accounts
 */
export function getInboxIssues(
  accounts: InboxAccount[] | undefined,
): ConnectionIssue[] {
  if (!accounts) return [];

  const issues: ConnectionIssue[] = [];

  for (const account of accounts) {
    if (account.status === "disconnected") {
      issues.push({
        type: "inbox",
        severity: "error",
        title: account.email,
        message: "Reconnection required",
        path: "/inbox/settings",
        linkText: "Reconnect",
      });
    }
  }

  return issues;
}

/**
 * Get the highest severity from a list of issues
 */
export function getHighestSeverity(
  issues: ConnectionIssue[],
): "error" | "warning" | null {
  if (issues.length === 0) return null;
  if (issues.some((issue) => issue.severity === "error")) return "error";
  if (issues.some((issue) => issue.severity === "warning")) return "warning";
  return null;
}

/**
 * Build connection issues from unified connectionStatus endpoint data
 */
export function buildConnectionIssues(
  data: ConnectionStatusData | undefined,
): ConnectionIssue[] {
  if (!data) return [];

  const issues: ConnectionIssue[] = [];

  // Process bank connections
  for (const connection of data.bankConnections) {
    const baseIssue = {
      type: "bank" as const,
      logoUrl: connection.logoUrl,
    };

    if (connection.status === "disconnected") {
      issues.push({
        ...baseIssue,
        severity: "error",
        title: connection.name || "Bank account",
        message: "Connection lost",
        path: "/settings/accounts",
        linkText: "Reconnect",
      });
      continue;
    }

    if (connection.expiresAt) {
      const daysUntilExpiry = differenceInDays(
        new Date(connection.expiresAt),
        new Date(),
      );

      if (daysUntilExpiry <= 0) {
        issues.push({
          ...baseIssue,
          severity: "error",
          title: connection.name || "Bank account",
          message: "Connection expired",
          path: "/settings/accounts",
          linkText: "Reconnect",
        });
      } else if (daysUntilExpiry <= ERROR_DAYS) {
        issues.push({
          ...baseIssue,
          severity: "error",
          title: connection.name || "Bank account",
          message: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`,
          path: "/settings/accounts",
          linkText: "Renew",
        });
      } else if (daysUntilExpiry <= WARNING_DAYS) {
        issues.push({
          ...baseIssue,
          severity: "warning",
          title: connection.name || "Bank account",
          message: `Expires in ${daysUntilExpiry} days`,
          path: "/settings/accounts",
          linkText: "Renew",
        });
      }
    }
  }

  // Process inbox accounts
  for (const account of data.inboxAccounts) {
    if (account.status === "disconnected") {
      issues.push({
        type: "inbox",
        severity: "error",
        title: account.email,
        message: "Reconnection required",
        path: "/inbox/settings",
        linkText: "Reconnect",
        provider: account.provider as "gmail" | "outlook",
      });
    }
  }

  return issues;
}

// Legacy functions for backward compatibility
type Connection = BankConnection;

export function getConnectionsStatus(connections: Connection[]) {
  const warning = connections?.some(
    (connection) =>
      connection.expiresAt &&
      differenceInDays(new Date(connection.expiresAt), new Date()) <=
        WARNING_DAYS,
  );

  const error = connections?.some(
    (connection) =>
      connection.expiresAt &&
      differenceInDays(new Date(connection.expiresAt), new Date()) <=
        ERROR_DAYS,
  );

  const expired = connections?.some(
    (connection) =>
      connection.expiresAt &&
      differenceInDays(new Date(connection.expiresAt), new Date()) <= 0,
  );

  const show = connections?.some(
    (connection) =>
      connection.expiresAt &&
      differenceInDays(new Date(connection.expiresAt), new Date()) <=
        DISPLAY_DAYS,
  );

  return {
    warning,
    expired,
    error,
    show,
  };
}

export function connectionStatus(connection: Connection) {
  const warning =
    connection.expiresAt &&
    differenceInDays(new Date(connection.expiresAt), new Date()) <=
      WARNING_DAYS;

  const error =
    connection.expiresAt &&
    differenceInDays(new Date(connection.expiresAt), new Date()) <= ERROR_DAYS;

  const expired =
    connection.expiresAt &&
    differenceInDays(new Date(connection.expiresAt), new Date()) <= 0;

  const show =
    connection.expiresAt &&
    differenceInDays(new Date(connection.expiresAt), new Date()) <=
      DISPLAY_DAYS;

  return {
    warning,
    error,
    expired,
    show,
  };
}
