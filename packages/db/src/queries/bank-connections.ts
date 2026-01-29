import type { Database } from "@db/client";
import { bankAccounts, bankConnections } from "@db/schema";
import { chatCache } from "@midday/cache/chat-cache";
import { decrypt, encrypt } from "@midday/encryption";
import { and, eq } from "drizzle-orm";

export type GetBankConnectionsParams = {
  teamId: string;
  enabled?: boolean;
};

export const getBankConnections = async (
  db: Database,
  params: GetBankConnectionsParams,
) => {
  const { teamId, enabled } = params;

  return db.query.bankConnections.findMany({
    where: eq(bankConnections.teamId, teamId),
    columns: {
      id: true,
      name: true,
      logoUrl: true,
      provider: true,
      expiresAt: true,
      enrollmentId: true,
      institutionId: true,
      referenceId: true,
      lastAccessed: true,
      accessToken: true,
      status: true,
    },
    with: {
      bankAccounts: {
        columns: {
          id: true,
          name: true,
          enabled: true,
          manual: true,
          currency: true,
          balance: true,
          type: true,
          errorRetries: true,
          // Additional account data for display (non-sensitive only)
          subtype: true,
          bic: true,
          // US bank account details (public, not sensitive)
          routingNumber: true,
          wireRoutingNumber: true,
          sortCode: true,
          // Credit account balances
          availableBalance: true,
          creditLimit: true,
          // Note: iban and accountNumber are encrypted and NOT returned here
          // Use getBankAccountDetails() to get decrypted sensitive data when needed
        },
        where:
          enabled !== undefined ? eq(bankAccounts.enabled, enabled) : undefined,
      },
    },
  });
};

type DeleteBankConnectionParams = {
  id: string;
  teamId: string;
};

export const deleteBankConnection = async (
  db: Database,
  params: DeleteBankConnectionParams,
) => {
  const { id, teamId } = params;

  const [result] = await db
    .delete(bankConnections)
    .where(and(eq(bankConnections.id, id), eq(bankConnections.teamId, teamId)))
    .returning({
      referenceId: bankConnections.referenceId,
      provider: bankConnections.provider,
      accessToken: bankConnections.accessToken,
    });

  return result;
};

export type CreateBankConnectionPayload = {
  accounts: {
    accountId: string;
    institutionId: string;
    logoUrl?: string | null;
    name: string;
    bankName: string;
    currency: string;
    enabled: boolean;
    balance?: number;
    type: "depository" | "credit" | "other_asset" | "loan" | "other_liability";
    accountReference?: string | null;
    expiresAt?: string | null;
    // Additional account data for reconnect matching and user display
    iban?: string | null;
    subtype?: string | null;
    bic?: string | null;
    // US bank account details (Teller, Plaid)
    routingNumber?: string | null;
    wireRoutingNumber?: string | null;
    accountNumber?: string | null; // Will be encrypted before storage
    sortCode?: string | null;
    // Credit account balances
    availableBalance?: number | null;
    creditLimit?: number | null;
  }[];
  accessToken?: string | null;
  enrollmentId?: string | null;
  referenceId?: string | null;
  teamId: string;
  userId: string;
  provider: "gocardless" | "teller" | "plaid" | "enablebanking";
};

export const createBankConnection = async (
  db: Database,
  payload: CreateBankConnectionPayload,
) => {
  const {
    accounts,
    accessToken,
    enrollmentId,
    referenceId,
    teamId,
    userId,
    provider,
  } = payload;

  // Get first account to create a bank connection
  const account = accounts?.at(0);

  if (!account) {
    return;
  }

  // Create or update bank connection
  const [bankConnection] = await db
    .insert(bankConnections)
    .values({
      institutionId: account.institutionId,
      name: account.bankName,
      logoUrl: account.logoUrl,
      teamId,
      provider,
      accessToken,
      enrollmentId,
      referenceId,
      expiresAt: account.expiresAt,
      lastAccessed: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [bankConnections.institutionId, bankConnections.teamId],
      set: {
        name: account.bankName,
        logoUrl: account.logoUrl,
        accessToken,
        enrollmentId,
        referenceId,
        expiresAt: account.expiresAt,
        lastAccessed: new Date().toISOString(),
      },
    })
    .returning();

  if (!bankConnection) {
    return;
  }

  // Create or update bank accounts
  await db.insert(bankAccounts).values(
    accounts.map((account) => ({
      accountId: account.accountId,
      bankConnectionId: bankConnection.id,
      teamId,
      createdBy: userId,
      name: account.name,
      currency: account.currency,
      enabled: account.enabled,
      type: account.type,
      accountReference: account.accountReference,
      balance: account.balance ?? 0,
      manual: false,
      // Additional account data for reconnect matching and user display
      subtype: account.subtype,
      bic: account.bic,
      // US bank account details
      routingNumber: account.routingNumber,
      wireRoutingNumber: account.wireRoutingNumber,
      sortCode: account.sortCode,
      // Sensitive data - encrypted at rest
      iban: account.iban ? encrypt(account.iban) : null,
      accountNumber: account.accountNumber
        ? encrypt(account.accountNumber)
        : null,
      // Credit account balances
      availableBalance: account.availableBalance,
      creditLimit: account.creditLimit,
    })),
  );

  // Invalidate team context cache to refresh hasBankAccounts flag
  await chatCache.invalidateTeamContext(teamId);

  return bankConnection;
};

export type GetBankAccountDetailsParams = {
  accountId: string;
  teamId: string;
};

/**
 * Get bank account details including decrypted sensitive fields.
 * Only call this when user explicitly requests to reveal account details.
 */
export const getBankAccountDetails = async (
  db: Database,
  params: GetBankAccountDetailsParams,
) => {
  const { accountId, teamId } = params;

  const account = await db.query.bankAccounts.findFirst({
    where: and(eq(bankAccounts.id, accountId), eq(bankAccounts.teamId, teamId)),
    columns: {
      id: true,
      iban: true,
      accountNumber: true,
      routingNumber: true,
      wireRoutingNumber: true,
      bic: true,
      sortCode: true,
    },
  });

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    // Decrypt sensitive fields
    iban: account.iban ? decrypt(account.iban) : null,
    accountNumber: account.accountNumber
      ? decrypt(account.accountNumber)
      : null,
    // Non-sensitive fields returned as-is
    routingNumber: account.routingNumber,
    wireRoutingNumber: account.wireRoutingNumber,
    bic: account.bic,
    sortCode: account.sortCode,
  };
};

// ============================================================================
// Bank Sync Queries
// ============================================================================

export type GetBankConnectionForSyncParams = {
  connectionId: string;
};

/**
 * Get a bank connection by ID for sync operations.
 * Returns provider credentials needed to call banking APIs.
 */
export async function getBankConnectionForSync(
  db: Database,
  params: GetBankConnectionForSyncParams,
) {
  return db.query.bankConnections.findFirst({
    where: eq(bankConnections.id, params.connectionId),
    columns: {
      id: true,
      teamId: true,
      provider: true,
      accessToken: true,
      referenceId: true,
      enrollmentId: true,
      institutionId: true,
      status: true,
    },
  });
}

export type UpdateBankConnectionStatusParams = {
  id: string;
  status: "connected" | "disconnected" | "unknown";
  lastAccessed?: boolean;
};

/**
 * Update bank connection status.
 * Optionally updates lastAccessed timestamp.
 */
export async function updateBankConnectionStatus(
  db: Database,
  params: UpdateBankConnectionStatusParams,
) {
  const { id, status, lastAccessed } = params;

  const [result] = await db
    .update(bankConnections)
    .set({
      status,
      ...(lastAccessed && { lastAccessed: new Date().toISOString() }),
    })
    .where(eq(bankConnections.id, id))
    .returning({ id: bankConnections.id });

  return result;
}

export type GetBankAccountsForSyncParams = {
  connectionId: string;
  /** If true, only return accounts with < 4 error retries (for background sync) */
  excludeHighErrorAccounts?: boolean;
};

/**
 * Get bank accounts for a connection that are ready for sync.
 * Returns accounts with their connection info for API calls.
 */
export async function getBankAccountsForSync(
  db: Database,
  params: GetBankAccountsForSyncParams,
) {
  const { connectionId, excludeHighErrorAccounts } = params;

  const accounts = await db.query.bankAccounts.findMany({
    where: and(
      eq(bankAccounts.bankConnectionId, connectionId),
      eq(bankAccounts.enabled, true),
      eq(bankAccounts.manual, false),
    ),
    columns: {
      id: true,
      teamId: true,
      accountId: true,
      type: true,
      errorRetries: true,
    },
    with: {
      bankConnection: {
        columns: {
          id: true,
          provider: true,
          accessToken: true,
          status: true,
        },
      },
    },
  });

  // Filter out accounts with high error retries if requested
  if (excludeHighErrorAccounts) {
    return accounts.filter(
      (account) => (account.errorRetries ?? 0) < 4,
    );
  }

  return accounts;
}

export type CheckAllAccountsFailedParams = {
  connectionId: string;
};

/**
 * Check if all enabled accounts for a connection have reached the error threshold.
 * Used to determine if the connection should be marked as disconnected.
 */
export async function checkAllAccountsFailed(
  db: Database,
  params: CheckAllAccountsFailedParams,
): Promise<boolean> {
  const accounts = await db.query.bankAccounts.findMany({
    where: and(
      eq(bankAccounts.bankConnectionId, params.connectionId),
      eq(bankAccounts.enabled, true),
      eq(bankAccounts.manual, false),
    ),
    columns: {
      errorRetries: true,
    },
  });

  if (accounts.length === 0) {
    return false;
  }

  return accounts.every((account) => (account.errorRetries ?? 0) >= 3);
}

export type UpdateBankConnectionReferenceParams = {
  connectionId: string;
  teamId: string;
  referenceId: string;
};

/**
 * Update bank connection reference ID after reconnect.
 */
export async function updateBankConnectionReference(
  db: Database,
  params: UpdateBankConnectionReferenceParams,
) {
  const { connectionId, teamId, referenceId } = params;

  const [result] = await db
    .update(bankConnections)
    .set({ referenceId })
    .where(
      and(
        eq(bankConnections.id, connectionId),
        eq(bankConnections.teamId, teamId),
      ),
    )
    .returning({ id: bankConnections.id });

  return result;
}

export type UpdateBankConnectionSessionByReferenceParams = {
  teamId: string;
  previousReferenceId: string;
  referenceId: string;
  expiresAt?: string | null;
  status?: "connected" | "disconnected" | "unknown";
};

/**
 * Update bank connection session data using the previous reference ID.
 * Used for OAuth reconnect flows where the provider issues a new session ID.
 */
export async function updateBankConnectionSessionByReference(
  db: Database,
  params: UpdateBankConnectionSessionByReferenceParams,
) {
  const { teamId, previousReferenceId, referenceId, expiresAt, status } = params;

  const [result] = await db
    .update(bankConnections)
    .set({
      referenceId,
      status: status ?? "connected",
      ...(expiresAt !== undefined && { expiresAt }),
    })
    .where(
      and(
        eq(bankConnections.referenceId, previousReferenceId),
        eq(bankConnections.teamId, teamId),
      ),
    )
    .returning({ id: bankConnections.id });

  return result;
}

export type GetExistingAccountsForReconnectParams = {
  connectionId: string;
  teamId: string;
};

/**
 * Get existing bank accounts for a connection during reconnect.
 * Returns fields needed for account matching.
 */
export async function getExistingAccountsForReconnect(
  db: Database,
  params: GetExistingAccountsForReconnectParams,
) {
  return db.query.bankAccounts.findMany({
    where: and(
      eq(bankAccounts.bankConnectionId, params.connectionId),
      eq(bankAccounts.teamId, params.teamId),
    ),
    columns: {
      id: true,
      accountReference: true,
      type: true,
      currency: true,
      name: true,
    },
  });
}

export type UpdateBankAccountIdParams = {
  id: string;
  accountId: string;
};

/**
 * Update bank account's external account ID after reconnect matching.
 */
export async function updateBankAccountId(
  db: Database,
  params: UpdateBankAccountIdParams,
) {
  const [result] = await db
    .update(bankAccounts)
    .set({ accountId: params.accountId })
    .where(eq(bankAccounts.id, params.id))
    .returning({ id: bankAccounts.id });

  return result;
}

// ============================================================================
// Webhook Queries
// ============================================================================

export type GetBankConnectionByReferenceIdParams = {
  referenceId: string;
};

/**
 * Get a bank connection by its reference ID (Plaid item_id, GoCardless requisition_id, etc.)
 * Used by webhooks to find connections from external provider IDs.
 */
export async function getBankConnectionByReferenceId(
  db: Database,
  params: GetBankConnectionByReferenceIdParams,
) {
  return db.query.bankConnections.findFirst({
    where: eq(bankConnections.referenceId, params.referenceId),
    columns: {
      id: true,
      teamId: true,
      createdAt: true,
    },
  });
}

export type GetBankConnectionByEnrollmentIdParams = {
  enrollmentId: string;
};

/**
 * Get a bank connection by its enrollment ID (Teller).
 * Used by Teller webhooks to find connections from enrollment IDs.
 */
export async function getBankConnectionByEnrollmentId(
  db: Database,
  params: GetBankConnectionByEnrollmentIdParams,
) {
  return db.query.bankConnections.findFirst({
    where: eq(bankConnections.enrollmentId, params.enrollmentId),
    columns: {
      id: true,
      teamId: true,
      createdAt: true,
    },
  });
}
