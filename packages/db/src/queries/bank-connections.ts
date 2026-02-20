import { decrypt, encrypt } from "@midday/encryption";
import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "../client";
import { bankAccounts, bankConnections } from "../schema";

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
          accountId: true,
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

  return bankConnection;
};

export type AddProviderAccountsParams = {
  connectionId: string;
  teamId: string;
  userId: string;
  accounts: {
    accountId: string;
    name: string;
    currency: string;
    type: "depository" | "credit" | "other_asset" | "loan" | "other_liability";
    accountReference?: string | null;
    balance?: number;
    iban?: string | null;
    subtype?: string | null;
    bic?: string | null;
    routingNumber?: string | null;
    wireRoutingNumber?: string | null;
    accountNumber?: string | null;
    sortCode?: string | null;
    availableBalance?: number | null;
    creditLimit?: number | null;
  }[];
};

export const addProviderAccounts = async (
  db: Database,
  params: AddProviderAccountsParams,
) => {
  const { connectionId, teamId, userId, accounts } = params;

  if (accounts.length === 0) return [];

  const connection = await db.query.bankConnections.findFirst({
    where: and(
      eq(bankConnections.id, connectionId),
      eq(bankConnections.teamId, teamId),
    ),
    columns: { id: true },
  });

  if (!connection) return [];

  const existing = await db.query.bankAccounts.findMany({
    where: and(
      eq(bankAccounts.bankConnectionId, connectionId),
      inArray(
        bankAccounts.accountId,
        accounts.map((a) => a.accountId),
      ),
    ),
    columns: { accountId: true },
  });

  const existingIds = new Set(existing.map((e) => e.accountId));
  const newAccounts = accounts.filter((a) => !existingIds.has(a.accountId));

  if (newAccounts.length === 0) return [];

  return db
    .insert(bankAccounts)
    .values(
      newAccounts.map((account) => ({
        accountId: account.accountId,
        bankConnectionId: connectionId,
        teamId,
        createdBy: userId,
        name: account.name,
        currency: account.currency,
        enabled: true,
        type: account.type,
        accountReference: account.accountReference,
        balance: account.balance ?? 0,
        manual: false,
        subtype: account.subtype,
        bic: account.bic,
        routingNumber: account.routingNumber,
        wireRoutingNumber: account.wireRoutingNumber,
        sortCode: account.sortCode,
        iban: account.iban ? encrypt(account.iban) : null,
        accountNumber: account.accountNumber
          ? encrypt(account.accountNumber)
          : null,
        availableBalance: account.availableBalance,
        creditLimit: account.creditLimit,
      })),
    )
    .returning();
};

export type ReconnectBankConnectionParams = {
  referenceId: string;
  newReferenceId: string;
  expiresAt: string;
  teamId: string;
};

export const reconnectBankConnection = async (
  db: Database,
  params: ReconnectBankConnectionParams,
) => {
  const { referenceId, newReferenceId, expiresAt, teamId } = params;

  const [result] = await db
    .update(bankConnections)
    .set({
      referenceId: newReferenceId,
      expiresAt,
      status: "connected",
    })
    .where(
      and(
        eq(bankConnections.referenceId, referenceId),
        eq(bankConnections.teamId, teamId),
      ),
    )
    .returning({
      id: bankConnections.id,
    });

  return result;
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

export const getBankConnectionByEnrollmentId = async (
  db: Database,
  params: { enrollmentId: string },
) => {
  return db.query.bankConnections.findFirst({
    where: eq(bankConnections.enrollmentId, params.enrollmentId),
    columns: {
      id: true,
      createdAt: true,
    },
    with: {
      team: {
        columns: {
          id: true,
          plan: true,
          createdAt: true,
        },
      },
    },
  });
};

export const getBankConnectionByReferenceId = async (
  db: Database,
  params: { referenceId: string },
) => {
  return db.query.bankConnections.findFirst({
    where: eq(bankConnections.referenceId, params.referenceId),
    columns: {
      id: true,
      createdAt: true,
    },
    with: {
      team: {
        columns: {
          id: true,
          plan: true,
          createdAt: true,
        },
      },
    },
  });
};

export const updateBankConnectionStatus = async (
  db: Database,
  params: { id: string; status: "connected" | "disconnected" | "unknown" },
) => {
  const [result] = await db
    .update(bankConnections)
    .set({ status: params.status })
    .where(eq(bankConnections.id, params.id))
    .returning({ id: bankConnections.id });

  return result;
};

export type GetBankAccountsWithPaymentInfoParams = {
  teamId: string;
};

export type BankAccountWithPaymentInfo = {
  id: string;
  name: string;
  bankName: string | null;
  currency: string | null;
  // Decrypted payment info
  iban: string | null;
  accountNumber: string | null;
  // Non-encrypted payment info
  routingNumber: string | null;
  wireRoutingNumber: string | null;
  bic: string | null;
  sortCode: string | null;
};

/**
 * Get bank accounts that have payment information (IBAN, routing numbers, etc.)
 * Returns decrypted sensitive fields for use in invoice payment details.
 * Only returns accounts that have at least one payment field populated.
 */
export const getBankAccountsWithPaymentInfo = async (
  db: Database,
  params: GetBankAccountsWithPaymentInfoParams,
): Promise<BankAccountWithPaymentInfo[]> => {
  const { teamId } = params;

  const accounts = await db.query.bankAccounts.findMany({
    where: and(eq(bankAccounts.teamId, teamId), eq(bankAccounts.enabled, true)),
    columns: {
      id: true,
      name: true,
      currency: true,
      iban: true,
      accountNumber: true,
      routingNumber: true,
      wireRoutingNumber: true,
      bic: true,
      sortCode: true,
    },
    with: {
      bankConnection: {
        columns: {
          name: true,
        },
      },
    },
  });

  // Filter to only accounts with payment info and decrypt sensitive fields
  return accounts
    .filter((account) => {
      // Must have at least one of: IBAN, or (routing + account number), or sort code
      const hasIban = !!account.iban;
      const hasUsPaymentInfo = !!(
        account.routingNumber && account.accountNumber
      );
      const hasUkPaymentInfo = !!(account.sortCode && account.accountNumber);
      return hasIban || hasUsPaymentInfo || hasUkPaymentInfo;
    })
    .map((account) => ({
      id: account.id,
      name: account.name || "Unknown Account",
      bankName: account.bankConnection?.name || null,
      currency: account.currency,
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
    }));
};
