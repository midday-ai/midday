import type { Database } from "@api/db";
import { bankAccounts } from "@api/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export type CreateBankAccountParams = {
  name: string;
  currency?: string;
  teamId: string;
  userId: string;
  accountId: string;
  manual?: boolean;
};

export async function createBankAccount(
  db: Database,
  params: CreateBankAccountParams,
) {
  const [result] = await db
    .insert(bankAccounts)
    .values({
      name: params.name,
      currency: params.currency,
      teamId: params.teamId,
      createdBy: params.userId,
      accountId: params.accountId,
      manual: params.manual,
    })
    .returning();

  return result;
}

export async function deleteBankAccount(db: Database, id: string) {
  const [result] = await db
    .delete(bankAccounts)
    .where(eq(bankAccounts.id, id))
    .returning();

  return result;
}

export type UpdateBankAccountParams = {
  id: string;
  teamId: string;
  name?: string;
  type?: "depository" | "credit" | "other_asset" | "loan" | "other_liability";
  balance?: number;
  enabled?: boolean;
};

export async function updateBankAccount(
  db: Database,
  params: UpdateBankAccountParams,
) {
  const { id, teamId, ...data } = params;

  const [result] = await db
    .update(bankAccounts)
    .set({
      ...data,
      // Numeric type in DB
      balance: data.balance?.toString(),
    })
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.teamId, teamId)))
    .returning();

  return result;
}

export type GetBankAccountsParams = {
  teamId: string;
  enabled?: boolean;
  manual?: boolean;
};

export async function getBankAccounts(
  db: Database,
  params: GetBankAccountsParams,
) {
  const { teamId, enabled, manual } = params;

  return db.query.bankAccounts.findMany({
    with: {
      bankConnection: true,
    },
    where: and(
      eq(bankAccounts.teamId, teamId),
      enabled !== undefined ? eq(bankAccounts.enabled, enabled) : undefined,
      manual !== undefined ? eq(bankAccounts.manual, manual) : undefined,
    ),
    orderBy: [asc(bankAccounts.createdAt), desc(bankAccounts.name)],
  });
}

type GetBankAccountBalanceResponse = {
  id: string;
  currency: string;
  balance: number;
  name: string;
  logo_url: string;
};

export async function getBankAccountsBalances(db: Database, teamId: string) {
  const result: GetBankAccountBalanceResponse[] = await db.execute(
    sql`SELECT * FROM get_team_bank_accounts_balances(${teamId})`,
  );

  return result;
}

type GetBankAccountsCurrenciesResponse = {
  currency: string;
};

export async function getBankAccountsCurrencies(db: Database, teamId: string) {
  const result: GetBankAccountsCurrenciesResponse[] = await db.execute(
    sql`SELECT * FROM get_bank_account_currencies(${teamId})`,
  );
  return result;
}
