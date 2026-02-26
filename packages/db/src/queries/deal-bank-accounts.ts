import type { Database } from "@db/client";
import { dealBankAccounts } from "@db/schema";
import { and, eq } from "drizzle-orm";

// ============================================================================
// Deal Bank Account Queries
// ============================================================================

export type CreateDealBankAccountParams = {
  dealId: string;
  teamId: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType?: string;
  linkedBankAccountId?: string;
  isPrimary?: boolean;
};

export const createDealBankAccount = async (
  db: Database,
  params: CreateDealBankAccountParams,
) => {
  const [result] = await db
    .insert(dealBankAccounts)
    .values({
      dealId: params.dealId,
      teamId: params.teamId,
      bankName: params.bankName,
      routingNumber: params.routingNumber,
      accountNumber: params.accountNumber,
      accountType: params.accountType || "checking",
      linkedBankAccountId: params.linkedBankAccountId,
      isPrimary: params.isPrimary ?? true,
    })
    .returning();

  return result;
};

export const getDealBankAccount = async (
  db: Database,
  params: { dealId: string; teamId: string },
) => {
  const [result] = await db
    .select()
    .from(dealBankAccounts)
    .where(
      and(
        eq(dealBankAccounts.dealId, params.dealId),
        eq(dealBankAccounts.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result;
};
