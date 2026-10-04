import { decrypt, encrypt } from "@midday/encryption";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../client";
import { bankAccounts, bankConnections } from "../schema";

export async function getBankAccountCurrency(
  db: DatabaseOrTransaction,
  params: { id: string; teamId: string },
) {
  const [row] = await db
    .select({ currency: bankAccounts.currency })
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.id, params.id),
        eq(bankAccounts.teamId, params.teamId),
      ),
    );
  return row;
}

export type UpdateBankAccountSyncStateParams = {
  id: string;
  teamId: string;
  balance?: number | null;
  availableBalance?: number | null;
  creditLimit?: number | null;
  currency?: string;
  errorDetails?: string | null;
  errorRetries?: number | null;
};

export async function updateBankAccountSyncState(
  db: DatabaseOrTransaction,
  { id, teamId, ...state }: UpdateBankAccountSyncStateParams,
) {
  const [row] = await db
    .update(bankAccounts)
    .set(state)
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.teamId, teamId)))
    .returning({ id: bankAccounts.id });
  return row;
}

export async function getBankAccountsForSync(
  db: DatabaseOrTransaction,
  params: { connectionId: string; teamId: string; includeErrored: boolean },
) {
  return db
    .select({
      id: bankAccounts.id,
      teamId: bankAccounts.teamId,
      accountId: bankAccounts.accountId,
      type: bankAccounts.type,
      currency: bankAccounts.currency,
      errorRetries: bankAccounts.errorRetries,
      bankConnection: {
        id: bankConnections.id,
        provider: bankConnections.provider,
        accessToken: bankConnections.accessToken,
        status: bankConnections.status,
      },
    })
    .from(bankAccounts)
    .innerJoin(
      bankConnections,
      and(
        eq(bankAccounts.bankConnectionId, bankConnections.id),
        eq(bankConnections.teamId, params.teamId),
      ),
    )
    .where(
      and(
        eq(bankAccounts.bankConnectionId, params.connectionId),
        eq(bankAccounts.teamId, params.teamId),
        eq(bankAccounts.enabled, true),
        eq(bankAccounts.manual, false),
        params.includeErrored
          ? undefined
          : or(
              lt(bankAccounts.errorRetries, 4),
              isNull(bankAccounts.errorRetries),
            ),
      ),
    );
}

export async function getBankAccountsByConnectionId(
  db: DatabaseOrTransaction,
  params: { connectionId: string; teamId: string },
) {
  const rows = await db
    .select({
      id: bankAccounts.id,
      accountReference: bankAccounts.accountReference,
      iban: bankAccounts.iban,
      type: bankAccounts.type,
      currency: bankAccounts.currency,
      name: bankAccounts.name,
    })
    .from(bankAccounts)
    .innerJoin(
      bankConnections,
      and(
        eq(bankAccounts.bankConnectionId, bankConnections.id),
        eq(bankConnections.teamId, params.teamId),
      ),
    )
    .where(
      and(
        eq(bankAccounts.bankConnectionId, params.connectionId),
        eq(bankAccounts.teamId, params.teamId),
      ),
    );
  return rows.map((row) => ({
    ...row,
    iban: row.iban ? decrypt(row.iban) : null,
  }));
}

export async function updateBankAccountMatch(
  db: DatabaseOrTransaction,
  params: {
    id: string;
    teamId: string;
    connectionId: string;
    accountId: string;
    accountReference?: string;
    iban?: string;
  },
) {
  const [row] = await db
    .update(bankAccounts)
    .set({
      accountId: params.accountId,
      accountReference: params.accountReference,
      iban: params.iban === undefined ? undefined : encrypt(params.iban),
    })
    .where(
      and(
        eq(bankAccounts.id, params.id),
        eq(bankAccounts.teamId, params.teamId),
        eq(bankAccounts.bankConnectionId, params.connectionId),
      ),
    )
    .returning({ id: bankAccounts.id });
  return row;
}
