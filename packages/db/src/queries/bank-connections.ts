import type { Database } from "@db/client";
import { bankAccounts, bankConnections } from "@db/schema";
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
    })),
  );

  return bankConnection;
};
