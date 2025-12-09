import type { Database } from "@db/client";
import { bankAccounts, teams } from "@db/schema";
import { chatCache } from "@midday/cache/chat-cache";
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

  // Invalidate team context cache to refresh hasBankAccounts flag
  await chatCache.invalidateTeamContext(params.teamId);

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

  // Invalidate team context cache to refresh hasBankAccounts flag
  await chatCache.invalidateTeamContext(teamId);

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
  baseBalance?: number;
  baseCurrency?: string;
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

export type GetBankAccountTeamIdParams = {
  id: string;
};

/**
 * Get teamId for a bank account by ID
 * Used by worker processors that don't have teamId in payload
 */
export async function getBankAccountTeamId(
  db: Database,
  params: GetBankAccountTeamIdParams,
): Promise<string | null> {
  const [result] = await db
    .select({ teamId: bankAccounts.teamId })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, params.id))
    .limit(1);

  return result?.teamId ?? null;
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

export type GetCombinedAccountBalanceParams = {
  teamId: string;
  currency?: string;
};

export async function getCombinedAccountBalance(
  db: Database,
  params: GetCombinedAccountBalanceParams,
) {
  const { teamId, currency: targetCurrency } = params;

  // Get team's base currency if no target currency specified
  let baseCurrency = targetCurrency;
  if (!baseCurrency) {
    const team = await db
      .select({ baseCurrency: teams.baseCurrency })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    baseCurrency = team[0]?.baseCurrency || "USD";
  }

  // Get all enabled bank accounts with their balances
  const accounts = await db.query.bankAccounts.findMany({
    where: and(eq(bankAccounts.teamId, teamId), eq(bankAccounts.enabled, true)),
    columns: {
      id: true,
      name: true,
      currency: true,
      balance: true,
      baseCurrency: true,
      baseBalance: true,
      type: true,
    },
    with: {
      bankConnection: {
        columns: {
          name: true,
          logoUrl: true,
        },
      },
    },
  });

  let totalBalance = 0;
  const accountBreakdown: Array<{
    id: string;
    name: string;
    originalBalance: number;
    originalCurrency: string;
    convertedBalance: number;
    convertedCurrency: string;
    type: string;
    logoUrl?: string;
  }> = [];

  for (const account of accounts) {
    const balance = Number(account.balance) || 0;
    const accountCurrency: string = account.currency || baseCurrency;

    let convertedBalance = balance;

    // Use baseBalance if available and currencies match, otherwise use original balance
    if (
      accountCurrency !== baseCurrency &&
      account.baseBalance &&
      account.baseCurrency === baseCurrency
    ) {
      convertedBalance = Number(account.baseBalance);
    } else if (accountCurrency !== baseCurrency) {
      // If no baseBalance available, use original balance as fallback
      // In a real scenario, you'd want to fetch exchange rates here
      convertedBalance = balance;
    }

    totalBalance += convertedBalance;

    accountBreakdown.push({
      id: account.id,
      name: account.name || "Unknown Account",
      originalBalance: balance,
      originalCurrency: accountCurrency,
      convertedBalance,
      convertedCurrency: baseCurrency,
      type: account.type || "depository",
      logoUrl: account.bankConnection?.logoUrl || undefined,
    });
  }

  return {
    totalBalance: Math.round(totalBalance * 100) / 100,
    currency: baseCurrency,
    accountCount: accounts.length,
    accountBreakdown,
  };
}
