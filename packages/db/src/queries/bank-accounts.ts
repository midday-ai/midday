import type { Database } from "@db/client";
import { bankAccounts } from "@db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export type CreateBankAccountParams = {
  name: string;
  currency?: string;
  teamId: string;
  userId: string;
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
      manual: params.manual,
      accountId: nanoid(),
    })
    .returning();

  return result;
}

type DeleteBankAccountParams = {
  id: string;
  teamId: string;
};

export async function deleteBankAccount(
  db: Database,
  params: DeleteBankAccountParams,
) {
  const { id, teamId } = params;

  const [result] = await db
    .delete(bankAccounts)
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.teamId, teamId)))
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
  currency?: string;
};

export async function updateBankAccount(
  db: Database,
  params: UpdateBankAccountParams,
) {
  const { id, teamId, ...data } = params;

  const [result] = await db
    .update(bankAccounts)
    .set(data)
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

type GetBankAccountByIdParams = {
  id: string;
  teamId: string;
};

export async function getBankAccountById(
  db: Database,
  params: GetBankAccountByIdParams,
) {
  return db.query.bankAccounts.findFirst({
    with: {
      bankConnection: true,
    },
    where: and(
      eq(bankAccounts.id, params.id),
      eq(bankAccounts.teamId, params.teamId),
    ),
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
  const result: GetBankAccountBalanceResponse[] = await db.executeOnReplica(
    sql`SELECT * FROM get_team_bank_accounts_balances(${teamId})`,
  );

  return result;
}

type GetBankAccountsCurrenciesResponse = {
  currency: string;
};

export async function getBankAccountsCurrencies(db: Database, teamId: string) {
  const result: GetBankAccountsCurrenciesResponse[] = await db.executeOnReplica(
    sql`SELECT * FROM get_bank_account_currencies(${teamId})`,
  );

  return result;
}
