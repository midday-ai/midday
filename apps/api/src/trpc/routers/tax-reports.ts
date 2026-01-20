/**
 * Tax Reports tRPC Router
 * 確定申告サポート用APIエンドポイント
 * Midday-JP
 */

import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getBalanceSheetForTax,
  getConsumptionTaxSummary,
  getExpenseByCategory,
  getIncomeStatement,
  getMonthlyBreakdown,
  getTaxFilingData,
  getWithholdingTaxSummary,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { z } from "zod";

const taxReportParamsSchema = z.object({
  fiscalYear: z
    .number()
    .min(2020)
    .max(2030)
    .describe("Fiscal year (e.g., 2024)"),
  currency: z.string().optional().describe("Currency code (e.g., JPY)"),
});

const reportTypeSchema = z.enum([
  "blue_return",
  "white_return",
]);

const accountingFormatSchema = z.enum(["yayoi", "freee", "moneyforward"]);

export const taxReportsRouter = createTRPCRouter({
  /**
   * Get complete tax filing data for a fiscal year
   * 確定申告用データを一括取得
   */
  getTaxFilingData: protectedProcedure
    .input(
      z.object({
        fiscalYear: z.number().min(2020).max(2030),
        reportType: reportTypeSchema.default("blue_return"),
      }),
    )
    .query(async ({ ctx: { teamId, db }, input }) => {
      const data = await getTaxFilingData(db, {
        teamId: teamId!,
        fiscalYear: input.fiscalYear,
      });

      return {
        ...data,
        reportType: input.reportType,
      };
    }),

  /**
   * Get income statement data
   * 損益計算書データを取得
   */
  getIncomeStatement: protectedProcedure
    .input(taxReportParamsSchema)
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getIncomeStatement(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  /**
   * Get balance sheet data
   * 貸借対照表データを取得
   */
  getBalanceSheet: protectedProcedure
    .input(taxReportParamsSchema)
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getBalanceSheetForTax(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  /**
   * Get expenses grouped by Japanese account category
   * 勘定科目別経費を取得
   */
  getExpenseByCategory: protectedProcedure
    .input(taxReportParamsSchema)
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getExpenseByCategory(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  /**
   * Get consumption tax summary
   * 消費税サマリーを取得
   */
  getConsumptionTaxSummary: protectedProcedure
    .input(taxReportParamsSchema)
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getConsumptionTaxSummary(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  /**
   * Get withholding tax summary
   * 源泉徴収税サマリーを取得
   */
  getWithholdingTaxSummary: protectedProcedure
    .input(taxReportParamsSchema)
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getWithholdingTaxSummary(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  /**
   * Get monthly breakdown of revenue and expenses
   * 月別売上・経費を取得
   */
  getMonthlyBreakdown: protectedProcedure
    .input(taxReportParamsSchema)
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getMonthlyBreakdown(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  /**
   * Get available fiscal years with data
   * データのある会計年度一覧を取得
   */
  getAvailableFiscalYears: protectedProcedure.query(
    async ({ ctx: { teamId, db } }) => {
      const currentYear = new Date().getFullYear();
      // Return last 5 years as available options
      return Array.from({ length: 5 }, (_, i) => currentYear - i);
    },
  ),

  /**
   * Export tax data to accounting software format
   * 会計ソフト形式でエクスポート
   */
  exportToAccountingSoftware: protectedProcedure
    .input(
      z.object({
        fiscalYear: z.number().min(2020).max(2030),
        format: accountingFormatSchema,
        locale: z.string().default("ja-JP"),
      }),
    )
    .mutation(async ({ input, ctx: { teamId, session } }) => {
      if (!teamId) {
        throw new Error("Team not found");
      }

      return triggerJob("export-tax-filing", {
        teamId,
        userId: session.user.id,
        fiscalYear: input.fiscalYear,
        format: input.format,
        locale: input.locale,
      }, "accounting");
    }),
});
