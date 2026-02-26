import type { Database } from "@db/client";
import { transactionRules, transactions, transactionTags, merchants, mcaDeals } from "@db/schema";
import { and, asc, eq, ilike, sql } from "drizzle-orm";

export type GetRulesParams = {
  teamId: string;
};

export const getTransactionRules = async (
  db: Database,
  params: GetRulesParams,
) => {
  return db
    .select()
    .from(transactionRules)
    .where(eq(transactionRules.teamId, params.teamId))
    .orderBy(asc(transactionRules.priority), asc(transactionRules.createdAt));
};

export type CreateRuleParams = {
  teamId: string;
  name: string;
  enabled?: boolean;
  priority?: number;
  merchantMatch?: string | null;
  merchantMatchType?: string;
  amountOperator?: string | null;
  amountValue?: number | null;
  amountValueMax?: number | null;
  accountId?: string | null;
  setCategorySlug?: string | null;
  setMerchantName?: string | null;
  addTagIds?: string[];
  setExcluded?: boolean | null;
  setAssignedId?: string | null;
  setDealCode?: string | null;
  autoResolveDeal?: boolean;
  dateStart?: string | null;
  dateEnd?: string | null;
};

export const createTransactionRule = async (
  db: Database,
  params: CreateRuleParams,
) => {
  const [rule] = await db
    .insert(transactionRules)
    .values({
      teamId: params.teamId,
      name: params.name,
      enabled: params.enabled ?? true,
      priority: params.priority ?? 0,
      merchantMatch: params.merchantMatch,
      merchantMatchType: params.merchantMatchType ?? "contains",
      amountOperator: params.amountOperator,
      amountValue: params.amountValue,
      amountValueMax: params.amountValueMax,
      accountId: params.accountId,
      setCategorySlug: params.setCategorySlug,
      setMerchantName: params.setMerchantName,
      addTagIds: params.addTagIds,
      setExcluded: params.setExcluded,
      setAssignedId: params.setAssignedId,
      setDealCode: params.setDealCode,
      autoResolveDeal: params.autoResolveDeal ?? false,
      dateStart: params.dateStart,
      dateEnd: params.dateEnd,
    })
    .returning();

  return rule;
};

export type UpdateRuleParams = {
  id: string;
  teamId: string;
  name?: string;
  enabled?: boolean;
  priority?: number;
  merchantMatch?: string | null;
  merchantMatchType?: string;
  amountOperator?: string | null;
  amountValue?: number | null;
  amountValueMax?: number | null;
  accountId?: string | null;
  setCategorySlug?: string | null;
  setMerchantName?: string | null;
  addTagIds?: string[];
  setExcluded?: boolean | null;
  setAssignedId?: string | null;
  setDealCode?: string | null;
  autoResolveDeal?: boolean;
  dateStart?: string | null;
  dateEnd?: string | null;
};

export const updateTransactionRule = async (
  db: Database,
  params: UpdateRuleParams,
) => {
  const { id, teamId, ...updates } = params;

  const [rule] = await db
    .update(transactionRules)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(
      and(eq(transactionRules.id, id), eq(transactionRules.teamId, teamId)),
    )
    .returning();

  return rule;
};

export type DeleteRuleParams = {
  id: string;
  teamId: string;
};

export const deleteTransactionRule = async (
  db: Database,
  params: DeleteRuleParams,
) => {
  const [rule] = await db
    .delete(transactionRules)
    .where(
      and(
        eq(transactionRules.id, params.id),
        eq(transactionRules.teamId, params.teamId),
      ),
    )
    .returning();

  return rule;
};

export type ApplyRulesParams = {
  teamId: string;
  transactionIds: string[];
};

export const applyTransactionRules = async (
  db: Database,
  params: ApplyRulesParams,
) => {
  const { teamId, transactionIds } = params;

  // Get all enabled rules for this team, ordered by priority
  const rules = await db
    .select()
    .from(transactionRules)
    .where(
      and(
        eq(transactionRules.teamId, teamId),
        eq(transactionRules.enabled, true),
      ),
    )
    .orderBy(asc(transactionRules.priority));

  if (rules.length === 0) return { applied: 0 };

  // Get the transactions to evaluate
  const txns = await db
    .select({
      id: transactions.id,
      name: transactions.name,
      merchantName: transactions.merchantName,
      amount: transactions.amount,
      bankAccountId: transactions.bankAccountId,
      date: transactions.date,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        sql`${transactions.id} = ANY(${transactionIds}::uuid[])`,
      ),
    );

  let applied = 0;

  for (const txn of txns) {
    for (const rule of rules) {
      if (!matchesRule(txn, rule)) continue;

      // Apply rule actions
      const updates: Record<string, unknown> = {};

      if (rule.setCategorySlug) {
        updates.categorySlug = rule.setCategorySlug;
      }
      if (rule.setMerchantName) {
        updates.merchantName = rule.setMerchantName;
      }
      if (rule.setExcluded !== null && rule.setExcluded !== undefined) {
        updates.internal = rule.setExcluded;
      }
      if (rule.setAssignedId) {
        updates.assignedId = rule.setAssignedId;
      }

      if (rule.setDealCode) {
        updates.dealCode = rule.setDealCode;
        updates.matchStatus = "auto_matched";
        updates.matchRule = rule.name;
        updates.matchedAt = new Date().toISOString();
      }

      if (rule.autoResolveDeal && (txn.merchantName ?? txn.name)) {
        const merchantTarget = (txn.merchantName ?? txn.name).toLowerCase();
        const [merchant] = await db
          .select({ id: merchants.id })
          .from(merchants)
          .where(
            and(
              eq(merchants.teamId, teamId),
              sql`LOWER(${merchants.name}) = ${merchantTarget}`,
            ),
          )
          .limit(1);

        if (merchant) {
          const [deal] = await db
            .select({ id: mcaDeals.id, dealCode: mcaDeals.dealCode })
            .from(mcaDeals)
            .where(
              and(
                eq(mcaDeals.merchantId, merchant.id),
                eq(mcaDeals.teamId, teamId),
                eq(mcaDeals.status, "active"),
              ),
            )
            .limit(1);

          if (deal) {
            updates.dealCode = deal.dealCode;
            updates.matchedDealId = deal.id;
            updates.matchStatus = "auto_matched";
            updates.matchRule = rule.name;
            updates.matchedAt = new Date().toISOString();
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await db
          .update(transactions)
          .set(updates)
          .where(eq(transactions.id, txn.id));
      }

      // Handle tag additions
      if (rule.addTagIds && rule.addTagIds.length > 0) {
        for (const tagId of rule.addTagIds) {
          await db
            .insert(transactionTags)
            .values({ transactionId: txn.id, tagId })
            .onConflictDoNothing();
        }
      }

      applied++;
      break; // First matching rule wins (stop after first match)
    }
  }

  return { applied };
};

function matchesRule(
  txn: {
    name: string;
    merchantName: string | null;
    amount: number;
    bankAccountId: string | null;
    date: string;
  },
  rule: typeof transactionRules.$inferSelect,
): boolean {
  // Check merchant match
  if (rule.merchantMatch) {
    const target = (txn.merchantName ?? txn.name).toLowerCase();
    const match = rule.merchantMatch.toLowerCase();

    switch (rule.merchantMatchType) {
      case "exact":
        if (target !== match) return false;
        break;
      case "starts_with":
        if (!target.startsWith(match)) return false;
        break;
      case "contains":
      default:
        if (!target.includes(match)) return false;
        break;
    }
  }

  // Check amount criteria
  if (rule.amountOperator && rule.amountValue !== null) {
    const amt = Math.abs(txn.amount);
    const val = Math.abs(rule.amountValue!);

    switch (rule.amountOperator) {
      case "eq":
        if (amt !== val) return false;
        break;
      case "gt":
        if (amt <= val) return false;
        break;
      case "lt":
        if (amt >= val) return false;
        break;
      case "between":
        if (
          rule.amountValueMax === null ||
          rule.amountValueMax === undefined
        )
          return false;
        if (amt < val || amt > Math.abs(rule.amountValueMax)) return false;
        break;
    }
  }

  // Check account
  if (rule.accountId && txn.bankAccountId !== rule.accountId) {
    return false;
  }

  // Check date range
  if (rule.dateStart && txn.date < rule.dateStart) {
    return false;
  }
  if (rule.dateEnd && txn.date > rule.dateEnd) {
    return false;
  }

  return true;
}
