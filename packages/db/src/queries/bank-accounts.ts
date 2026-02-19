import {
  CASH_ACCOUNT_TYPES,
  CREDIT_ACCOUNT_TYPE,
} from "@midday/banking/account";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Database } from "../client";
import { bankAccounts, teams } from "../schema";

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

export type GetCashBalanceParams = {
  teamId: string;
  currency?: string;
};

/**
 * Get total cash balance across all cash accounts (depository + other_asset).
 * Credit cards, loans, and other liabilities are excluded.
 */
export async function getCashBalance(
  db: Database,
  params: GetCashBalanceParams,
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

  // Get cash accounts (depository + other_asset like treasury/money market)
  const accounts = await db.query.bankAccounts.findMany({
    where: and(
      eq(bankAccounts.teamId, teamId),
      eq(bankAccounts.enabled, true),
      inArray(bankAccounts.type, [...CASH_ACCOUNT_TYPES]),
    ),
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

export type GetNetPositionParams = {
  teamId: string;
  currency?: string;
};

/**
 * Calculate net position: Cash minus Credit Card Debt.
 *
 * Net Position provides a quick "working capital" view for SMB owners.
 *
 * **Cash includes:**
 * - `depository` accounts (checking, savings)
 * - `other_asset` accounts (treasury, money market)
 *
 * **Debt includes:**
 * - `credit` accounts (credit cards)
 *
 * **Why loans are excluded:**
 * Loan accounts (`loan` type) are intentionally NOT included in Net Position because:
 * 1. Net Position is designed as a simple "cash vs credit card" metric
 * 2. Loans are long-term liabilities with different payment structures
 * 3. Including loans would conflate short-term liquidity with long-term debt
 * 4. For complete debt visibility, use `getBalanceSheet()` which includes all debt types
 *
 * @see getBalanceSheet - For complete assets/liabilities including loans
 * @see getCashBalance - For cash-only calculation
 */
export async function getNetPosition(
  db: Database,
  params: GetNetPositionParams,
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

  // Get cash accounts (depository + other_asset like treasury)
  // Uses shared CASH_ACCOUNT_TYPES constant for consistency
  const cashAccounts = await db.query.bankAccounts.findMany({
    where: and(
      eq(bankAccounts.teamId, teamId),
      eq(bankAccounts.enabled, true),
      inArray(bankAccounts.type, [...CASH_ACCOUNT_TYPES]),
    ),
    columns: {
      id: true,
      name: true,
      currency: true,
      balance: true,
      baseCurrency: true,
      baseBalance: true,
    },
  });

  // Get credit accounts (credit cards only - NOT loans)
  // Loans are excluded by design - see JSDoc above for rationale
  // For complete debt view including loans, use getBalanceSheet()
  const creditAccounts = await db.query.bankAccounts.findMany({
    where: and(
      eq(bankAccounts.teamId, teamId),
      eq(bankAccounts.enabled, true),
      eq(bankAccounts.type, CREDIT_ACCOUNT_TYPE), // Only "credit", not "loan"
    ),
    columns: {
      id: true,
      name: true,
      currency: true,
      balance: true,
      baseCurrency: true,
      baseBalance: true,
    },
  });

  // Calculate cash total
  let cashTotal = 0;
  for (const account of cashAccounts) {
    const balance = Number(account.balance) || 0;
    const accountCurrency: string = account.currency || baseCurrency;

    let convertedBalance = balance;
    if (
      accountCurrency !== baseCurrency &&
      account.baseBalance &&
      account.baseCurrency === baseCurrency
    ) {
      convertedBalance = Number(account.baseBalance);
    }

    cashTotal += convertedBalance;
  }

  // Calculate credit debt total
  // Note: Different providers store credit balances differently:
  // - Plaid stores as positive (amount owed)
  // - GoCardless stores as negative (debt)
  // We use Math.abs() to normalize both conventions
  let creditDebt = 0;
  for (const account of creditAccounts) {
    const balance = Number(account.balance) || 0;
    const accountCurrency: string = account.currency || baseCurrency;

    let convertedBalance = Math.abs(balance);
    if (
      accountCurrency !== baseCurrency &&
      account.baseBalance &&
      account.baseCurrency === baseCurrency
    ) {
      convertedBalance = Math.abs(Number(account.baseBalance));
    }

    creditDebt += convertedBalance;
  }

  const netPosition = cashTotal - creditDebt;

  return {
    cash: Math.round(cashTotal * 100) / 100,
    creditDebt: Math.round(creditDebt * 100) / 100,
    netPosition: Math.round(netPosition * 100) / 100,
    currency: baseCurrency,
    cashAccountCount: cashAccounts.length,
    creditAccountCount: creditAccounts.length,
  };
}
