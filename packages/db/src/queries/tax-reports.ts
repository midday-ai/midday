/**
 * Tax Reports Queries
 * 確定申告サポート用クエリ
 * Midday-JP
 */

import type { Database } from "@db/client";
import { REVENUE_CATEGORIES } from "@midday/categories";
import {
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
} from "date-fns";
import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  ne,
  or,
  sql,
  sum,
} from "drizzle-orm";
import {
  bankAccounts,
  invoices,
  transactions,
  transactionCategories,
} from "../schema";

// ============================================================================
// Types
// ============================================================================

export interface TaxReportParams {
  teamId: string;
  fiscalYear: number; // 2024 = 2024/1/1〜2024/12/31
  currency?: string;
}

export interface IncomeStatementData {
  revenue: {
    total: number;
    byCategory: Array<{
      categoryCode: string;
      categoryName: string;
      amount: number;
    }>;
  };
  expenses: {
    total: number;
    byCategory: Array<{
      categoryCode: string;
      categoryName: string;
      amount: number;
      isDeductible: boolean;
    }>;
  };
  grossProfit: number;
  operatingIncome: number;
}

export interface BalanceSheetData {
  assets: {
    cash: number;
    accountsReceivable: number;
    other: number;
    total: number;
  };
  liabilities: {
    accountsPayable: number;
    other: number;
    total: number;
  };
  equity: number;
  asOfDate: string;
}

export interface ExpenseByCategoryData {
  categoryCode: string;
  categoryNameJa: string;
  categoryNameEn: string;
  amount: number;
  transactionCount: number;
  isDeductible: boolean;
}

export interface ConsumptionTaxSummaryData {
  /** 課税売上高（10%） */
  taxableSales10: number;
  /** 課税売上高（8%軽減） */
  taxableSales8: number;
  /** 非課税売上高 */
  exemptSales: number;
  /** 課税仕入高（適格請求書あり） */
  taxablePurchasesQualified: number;
  /** 課税仕入高（適格請求書なし） */
  taxablePurchasesNonQualified: number;
  /** 預かり消費税額 */
  collectedTax: number;
  /** 支払消費税額（控除対象） */
  paidTaxDeductible: number;
  /** 支払消費税額（控除対象外） */
  paidTaxNonDeductible: number;
  /** 納付予定額 */
  taxPayable: number;
  /** 適格請求書率 */
  qualifiedInvoiceRatio: number;
}

export interface WithholdingTaxSummaryData {
  /** 源泉徴収税額合計 */
  totalWithheld: number;
  /** 源泉徴収対象収入 */
  subjectToWithholding: number;
  /** 還付見込額（概算） */
  estimatedRefund: number;
  /** 取引件数 */
  transactionCount: number;
}

export interface MonthlyBreakdownData {
  month: string; // "2024-01", "2024-02", ...
  revenue: number;
  expenses: number;
  profit: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFiscalYearDateRange(fiscalYear: number) {
  const startDate = startOfYear(new Date(fiscalYear, 0, 1));
  const endDate = endOfYear(new Date(fiscalYear, 0, 1));
  return {
    from: format(startDate, "yyyy-MM-dd"),
    to: format(endDate, "yyyy-MM-dd"),
  };
}

// ============================================================================
// Main Query Functions
// ============================================================================

/**
 * 損益計算書データを取得
 * Get Income Statement data for tax filing
 */
export async function getIncomeStatement(
  db: Database,
  params: TaxReportParams,
): Promise<IncomeStatementData> {
  const { teamId, fiscalYear, currency } = params;
  const { from, to } = getFiscalYearDateRange(fiscalYear);

  // Get revenue transactions
  const revenueResult = await db
    .select({
      categoryCode: transactions.expenseCategoryCode,
      categorySlug: transactions.categorySlug,
      total: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        gte(transactions.date, from),
        lte(transactions.date, to),
        ne(transactions.status, "excluded"),
        eq(transactions.internal, false),
        sql`${transactions.amount} > 0`, // Revenue is positive
        or(
          inArray(transactions.categorySlug, REVENUE_CATEGORIES),
          sql`${transactions.expenseCategoryCode} LIKE '4%'`, // 400番台 = 収益
        ),
      ),
    )
    .groupBy(transactions.expenseCategoryCode, transactions.categorySlug);

  // Get expense transactions
  const expenseResult = await db
    .select({
      categoryCode: transactions.expenseCategoryCode,
      categorySlug: transactions.categorySlug,
      isDeductible: transactions.isDeductible,
      total: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        gte(transactions.date, from),
        lte(transactions.date, to),
        ne(transactions.status, "excluded"),
        eq(transactions.internal, false),
        sql`${transactions.amount} < 0`, // Expenses are negative
        or(
          sql`${transactions.expenseCategoryCode} >= '500'`,
          sql`${transactions.categorySlug} IS NOT NULL`,
        ),
      ),
    )
    .groupBy(
      transactions.expenseCategoryCode,
      transactions.categorySlug,
      transactions.isDeductible,
    );

  const totalRevenue = revenueResult.reduce(
    (sum, item) => sum + Number(item.total),
    0,
  );
  const totalExpenses = expenseResult.reduce(
    (sum, item) => sum + Number(item.total),
    0,
  );

  return {
    revenue: {
      total: totalRevenue,
      byCategory: revenueResult.map((item) => ({
        categoryCode: item.categoryCode || "410",
        categoryName: item.categorySlug || "売上高",
        amount: Number(item.total),
      })),
    },
    expenses: {
      total: totalExpenses,
      byCategory: expenseResult.map((item) => ({
        categoryCode: item.categoryCode || "890",
        categoryName: item.categorySlug || "その他経費",
        amount: Number(item.total),
        isDeductible: item.isDeductible ?? true,
      })),
    },
    grossProfit: totalRevenue - totalExpenses,
    operatingIncome: totalRevenue - totalExpenses, // Simplified for freelancers
  };
}

/**
 * 貸借対照表データを取得
 * Get Balance Sheet data
 */
export async function getBalanceSheetForTax(
  db: Database,
  params: TaxReportParams,
): Promise<BalanceSheetData> {
  const { teamId, fiscalYear } = params;
  const { to } = getFiscalYearDateRange(fiscalYear);

  // Get cash balance from bank accounts
  const cashResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${bankAccounts.balance}), 0)`,
    })
    .from(bankAccounts)
    .where(
      and(eq(bankAccounts.teamId, teamId), eq(bankAccounts.enabled, true)),
    );

  // Get accounts receivable from unpaid invoices
  const receivableResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        eq(invoices.status, "unpaid"),
        lte(invoices.issueDate, to),
      ),
    );

  const cashBalance = Number(cashResult[0]?.total || 0);
  const accountsReceivable = Number(receivableResult[0]?.total || 0);

  return {
    assets: {
      cash: cashBalance,
      accountsReceivable: accountsReceivable,
      other: 0,
      total: cashBalance + accountsReceivable,
    },
    liabilities: {
      accountsPayable: 0, // Would need accounts payable table
      other: 0,
      total: 0,
    },
    equity: cashBalance + accountsReceivable,
    asOfDate: to,
  };
}

/**
 * 勘定科目別経費集計
 * Get expenses grouped by Japanese account code
 */
export async function getExpenseByCategory(
  db: Database,
  params: TaxReportParams,
): Promise<ExpenseByCategoryData[]> {
  const { teamId, fiscalYear } = params;
  const { from, to } = getFiscalYearDateRange(fiscalYear);

  const result = await db
    .select({
      categoryCode: transactions.expenseCategoryCode,
      categorySlug: transactions.categorySlug,
      isDeductible: transactions.isDeductible,
      total: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        gte(transactions.date, from),
        lte(transactions.date, to),
        ne(transactions.status, "excluded"),
        eq(transactions.internal, false),
        sql`${transactions.amount} < 0`, // Expenses are negative
      ),
    )
    .groupBy(
      transactions.expenseCategoryCode,
      transactions.categorySlug,
      transactions.isDeductible,
    )
    .orderBy(transactions.expenseCategoryCode);

  // Map to Japanese account names
  const accountCodeToName: Record<string, { ja: string; en: string }> = {
    "510": { ja: "仕入高", en: "Cost of Goods Sold" },
    "520": { ja: "外注費", en: "Outsourcing Costs" },
    "610": { ja: "役員報酬", en: "Executive Compensation" },
    "620": { ja: "給料賃金", en: "Salaries & Wages" },
    "710": { ja: "旅費交通費", en: "Travel & Transportation" },
    "720": { ja: "通信費", en: "Communication Expenses" },
    "730": { ja: "広告宣伝費", en: "Advertising & Promotion" },
    "740": { ja: "接待交際費", en: "Entertainment Expenses" },
    "750": { ja: "会議費", en: "Meeting Expenses" },
    "760": { ja: "消耗品費", en: "Consumable Supplies" },
    "770": { ja: "事務用品費", en: "Office Supplies" },
    "780": { ja: "水道光熱費", en: "Utilities" },
    "790": { ja: "地代家賃", en: "Rent" },
    "810": { ja: "支払手数料", en: "Service Fees" },
    "820": { ja: "租税公課", en: "Taxes & Public Charges" },
    "830": { ja: "保険料", en: "Insurance" },
    "860": { ja: "減価償却費", en: "Depreciation" },
    "890": { ja: "雑費", en: "Miscellaneous Expenses" },
    "491": { ja: "ソフトウェア利用料", en: "Software Subscriptions" },
  };

  return result.map((item) => {
    const code = item.categoryCode || "890";
    const names = accountCodeToName[code] || { ja: "その他", en: "Other" };

    return {
      categoryCode: code,
      categoryNameJa: names.ja,
      categoryNameEn: names.en,
      amount: Number(item.total),
      transactionCount: Number(item.count),
      isDeductible: item.isDeductible ?? true,
    };
  });
}

/**
 * 消費税サマリーを取得
 * Get Consumption Tax Summary for tax filing
 */
export async function getConsumptionTaxSummary(
  db: Database,
  params: TaxReportParams,
): Promise<ConsumptionTaxSummaryData> {
  const { teamId, fiscalYear } = params;
  const { from, to } = getFiscalYearDateRange(fiscalYear);

  // Get sales by tax category
  const salesResult = await db
    .select({
      taxCategory: transactions.taxCategory,
      total: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        gte(transactions.date, from),
        lte(transactions.date, to),
        ne(transactions.status, "excluded"),
        eq(transactions.internal, false),
        sql`${transactions.amount} > 0`,
      ),
    )
    .groupBy(transactions.taxCategory);

  // Get purchases by qualified invoice status
  const purchasesResult = await db
    .select({
      hasQualifiedInvoice: transactions.hasQualifiedInvoice,
      taxCategory: transactions.taxCategory,
      total: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        gte(transactions.date, from),
        lte(transactions.date, to),
        ne(transactions.status, "excluded"),
        eq(transactions.internal, false),
        sql`${transactions.amount} < 0`,
        ne(transactions.taxCategory, "exempt"),
        ne(transactions.taxCategory, "non_taxable"),
      ),
    )
    .groupBy(transactions.hasQualifiedInvoice, transactions.taxCategory);

  // Calculate totals
  let taxableSales10 = 0;
  let taxableSales8 = 0;
  let exemptSales = 0;

  for (const row of salesResult) {
    const amount = Number(row.total);
    switch (row.taxCategory) {
      case "standard_10":
        taxableSales10 += amount;
        break;
      case "reduced_8":
        taxableSales8 += amount;
        break;
      case "exempt":
      case "non_taxable":
        exemptSales += amount;
        break;
      default:
        taxableSales10 += amount; // Default to standard rate
    }
  }

  let taxablePurchasesQualified = 0;
  let taxablePurchasesNonQualified = 0;

  for (const row of purchasesResult) {
    const amount = Number(row.total);
    if (row.hasQualifiedInvoice) {
      taxablePurchasesQualified += amount;
    } else {
      taxablePurchasesNonQualified += amount;
    }
  }

  // Calculate tax amounts
  const collectedTax = taxableSales10 * 0.1 + taxableSales8 * 0.08;
  const paidTaxDeductible =
    taxablePurchasesQualified * 0.1 + taxablePurchasesQualified * 0.08 * 0.5;
  const paidTaxNonDeductible = taxablePurchasesNonQualified * 0.1 * 0.2; // 80% not deductible under transitional measures
  const taxPayable = collectedTax - paidTaxDeductible;

  const totalPurchases =
    taxablePurchasesQualified + taxablePurchasesNonQualified;
  const qualifiedInvoiceRatio =
    totalPurchases > 0 ? taxablePurchasesQualified / totalPurchases : 0;

  return {
    taxableSales10,
    taxableSales8,
    exemptSales,
    taxablePurchasesQualified,
    taxablePurchasesNonQualified,
    collectedTax,
    paidTaxDeductible,
    paidTaxNonDeductible,
    taxPayable,
    qualifiedInvoiceRatio,
  };
}

/**
 * 源泉徴収税サマリーを取得
 * Get Withholding Tax Summary
 */
export async function getWithholdingTaxSummary(
  db: Database,
  params: TaxReportParams,
): Promise<WithholdingTaxSummaryData> {
  const { teamId, fiscalYear } = params;
  const { from, to } = getFiscalYearDateRange(fiscalYear);

  const result = await db
    .select({
      totalWithheld:
        sql<number>`COALESCE(SUM(${transactions.withholdingTaxAmount}), 0)`,
      subjectToWithholding: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.withholdingTaxAmount} > 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
      count: sql<number>`COUNT(CASE WHEN ${transactions.withholdingTaxAmount} > 0 THEN 1 END)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        gte(transactions.date, from),
        lte(transactions.date, to),
        ne(transactions.status, "excluded"),
        isNotNull(transactions.withholdingTaxAmount),
      ),
    );

  const totalWithheld = Number(result[0]?.totalWithheld || 0);
  const subjectToWithholding = Number(result[0]?.subjectToWithholding || 0);
  const transactionCount = Number(result[0]?.count || 0);

  // Estimated refund is a rough calculation
  // Actual refund depends on total income and deductions
  const estimatedRefund = totalWithheld * 0.3; // Rough estimate: 30% might be refundable

  return {
    totalWithheld,
    subjectToWithholding,
    estimatedRefund,
    transactionCount,
  };
}

/**
 * 月別売上・経費内訳を取得
 * Get Monthly breakdown of revenue and expenses
 */
export async function getMonthlyBreakdown(
  db: Database,
  params: TaxReportParams,
): Promise<MonthlyBreakdownData[]> {
  const { teamId, fiscalYear } = params;
  const { from, to } = getFiscalYearDateRange(fiscalYear);

  const result = await db
    .select({
      month: sql<string>`TO_CHAR(${transactions.date}::date, 'YYYY-MM')`,
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        gte(transactions.date, from),
        lte(transactions.date, to),
        ne(transactions.status, "excluded"),
        eq(transactions.internal, false),
      ),
    )
    .groupBy(sql`TO_CHAR(${transactions.date}::date, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transactions.date}::date, 'YYYY-MM')`);

  return result.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue),
    expenses: Number(row.expenses),
    profit: Number(row.revenue) - Number(row.expenses),
  }));
}

/**
 * 確定申告用の全データを一括取得
 * Get all tax filing data at once
 */
export async function getTaxFilingData(
  db: Database,
  params: TaxReportParams,
): Promise<{
  fiscalYear: number;
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  expenseByCategory: ExpenseByCategoryData[];
  consumptionTax: ConsumptionTaxSummaryData;
  withholdingTax: WithholdingTaxSummaryData;
  monthlyBreakdown: MonthlyBreakdownData[];
}> {
  const [
    incomeStatement,
    balanceSheet,
    expenseByCategory,
    consumptionTax,
    withholdingTax,
    monthlyBreakdown,
  ] = await Promise.all([
    getIncomeStatement(db, params),
    getBalanceSheetForTax(db, params),
    getExpenseByCategory(db, params),
    getConsumptionTaxSummary(db, params),
    getWithholdingTaxSummary(db, params),
    getMonthlyBreakdown(db, params),
  ]);

  return {
    fiscalYear: params.fiscalYear,
    incomeStatement,
    balanceSheet,
    expenseByCategory,
    consumptionTax,
    withholdingTax,
    monthlyBreakdown,
  };
}
