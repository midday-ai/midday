import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  createMcaDeal,
  getMcaDeals,
  getMcaDealById,
  getMcaDealStats,
  getMcaDealStatusBreakdown,
  updateMcaDeal,
} from "@db/queries/mca-deals";
import { createMcaPayment } from "@db/queries/mca-payments";
import { createDealBankAccount } from "@db/queries/deal-bank-accounts";
import { getBrokerById, upsertCommission } from "@db/queries";
import { calculateRiskScore } from "@api/services/risk-engine";
import type { Database } from "@db/client";
import { z } from "zod";

async function createBrokerCommission(
  db: Database,
  params: {
    dealId: string;
    brokerId: string;
    teamId: string;
    fundingAmount: number;
    commissionType?: "percentage" | "flat";
    commissionPercentage?: number;
    commissionAmount?: number;
  },
) {
  let type = params.commissionType;
  let pct = params.commissionPercentage;
  let amount = params.commissionAmount;

  // Fall back to broker defaults if not overridden
  if (type === undefined || (pct === undefined && amount === undefined)) {
    const broker = await getBrokerById(db, {
      id: params.brokerId,
      teamId: params.teamId,
    });

    if (type === undefined) {
      type =
        (broker?.commissionType as "percentage" | "flat") ?? "percentage";
    }

    if (type === "percentage" && pct === undefined) {
      pct = broker?.commissionPercentage
        ? Number(broker.commissionPercentage)
        : 0;
    }

    if (type === "flat" && amount === undefined) {
      amount = broker?.flatFee
        ? Number(broker.flatFee)
        : 0;
    }
  }

  // Calculate amount from percentage or vice versa
  if (type === "percentage") {
    pct = pct ?? 0;
    amount = +(params.fundingAmount * (pct / 100)).toFixed(2);
  } else {
    amount = amount ?? 0;
    pct =
      params.fundingAmount > 0
        ? +((amount / params.fundingAmount) * 100).toFixed(2)
        : 0;
  }

  await upsertCommission(db, {
    dealId: params.dealId,
    brokerId: params.brokerId,
    teamId: params.teamId,
    commissionType: type ?? "percentage",
    commissionPercentage: pct,
    commissionAmount: amount,
    status: "pending",
  });
}

const createDealSchema = z.object({
  merchantId: z.string().uuid(),
  dealCode: z.string().min(1).optional(),
  fundingAmount: z.number().positive("Funding amount must be positive"),
  factorRate: z.number().positive("Factor rate must be positive"),
  paybackAmount: z.number().positive("Payback amount must be positive"),
  dailyPayment: z.number().positive().optional(),
  paymentFrequency: z
    .enum(["daily", "weekly", "bi_weekly", "monthly", "variable"])
    .default("daily"),
  fundedAt: z.string().optional(),
  expectedPayoffDate: z.string().optional(),
  externalId: z.string().optional(),
  brokerId: z.string().uuid().optional(),
  commissionType: z.enum(["percentage", "flat"]).optional(),
  commissionPercentage: z.number().min(0).max(100).optional(),
  commissionAmount: z.number().min(0).optional(),
});

const bankAccountSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    existingBankAccountId: z.string().uuid(),
  }),
  z.object({
    mode: z.literal("new"),
    bankName: z.string().min(1, "Bank name is required"),
    routingNumber: z.string().min(1, "Routing number is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    accountType: z.enum(["checking", "savings"]).default("checking"),
  }),
]);

const createDealWithBankAccountSchema = createDealSchema.extend({
  // Contract Dates
  startDate: z.string().optional(),
  maturityDate: z.string().optional(),
  firstPaymentDate: z.string().optional(),
  // Holdback
  holdbackPercentage: z.number().min(0).max(100).optional(),
  // Legal Terms
  uccFilingStatus: z.enum(["filed", "pending", "not_filed"]).optional(),
  personalGuarantee: z.boolean().optional(),
  defaultTerms: z.string().optional(),
  curePeriodDays: z.number().int().positive().optional(),
  // Bank Account
  bankAccount: bankAccountSchema.optional(),
});

export const mcaDealsRouter = createTRPCRouter({
  create: memberProcedure
    .input(createDealSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const deal = await createMcaDeal(db, {
        teamId: teamId!,
        merchantId: input.merchantId,
        dealCode: input.dealCode,
        fundingAmount: input.fundingAmount,
        factorRate: input.factorRate,
        paybackAmount: input.paybackAmount,
        dailyPayment: input.dailyPayment,
        paymentFrequency: input.paymentFrequency,
        fundedAt: input.fundedAt,
        expectedPayoffDate: input.expectedPayoffDate,
        currentBalance: input.paybackAmount,
        externalId: input.externalId,
        brokerId: input.brokerId,
      });

      // Auto-create broker commission if a broker is assigned
      if (deal && input.brokerId) {
        await createBrokerCommission(db, {
          dealId: deal.id,
          brokerId: input.brokerId,
          teamId: teamId!,
          fundingAmount: input.fundingAmount,
          commissionType: input.commissionType,
          commissionPercentage: input.commissionPercentage,
          commissionAmount: input.commissionAmount,
        });
      }

      return deal;
    }),

  createWithBankAccount: memberProcedure
    .input(createDealWithBankAccountSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const { bankAccount, ...dealInput } = input;

      // Create the deal with all fields
      const deal = await createMcaDeal(db, {
        teamId: teamId!,
        merchantId: dealInput.merchantId,
        dealCode: dealInput.dealCode,
        fundingAmount: dealInput.fundingAmount,
        factorRate: dealInput.factorRate,
        paybackAmount: dealInput.paybackAmount,
        dailyPayment: dealInput.dailyPayment,
        paymentFrequency: dealInput.paymentFrequency,
        fundedAt: dealInput.fundedAt,
        expectedPayoffDate: dealInput.expectedPayoffDate,
        currentBalance: dealInput.paybackAmount,
        externalId: dealInput.externalId,
        brokerId: dealInput.brokerId,
        startDate: dealInput.startDate,
        maturityDate: dealInput.maturityDate,
        firstPaymentDate: dealInput.firstPaymentDate,
        holdbackPercentage: dealInput.holdbackPercentage,
        uccFilingStatus: dealInput.uccFilingStatus,
        personalGuarantee: dealInput.personalGuarantee,
        defaultTerms: dealInput.defaultTerms,
        curePeriodDays: dealInput.curePeriodDays,
      });

      if (!deal) {
        throw new Error("Failed to create deal");
      }

      // Create bank account record if provided
      if (bankAccount) {
        if (bankAccount.mode === "new") {
          await createDealBankAccount(db, {
            dealId: deal.id,
            teamId: teamId!,
            bankName: bankAccount.bankName,
            routingNumber: bankAccount.routingNumber,
            accountNumber: bankAccount.accountNumber,
            accountType: bankAccount.accountType,
          });
        } else {
          await createDealBankAccount(db, {
            dealId: deal.id,
            teamId: teamId!,
            bankName: "Linked Account",
            routingNumber: "",
            accountNumber: "",
            linkedBankAccountId: bankAccount.existingBankAccountId,
          });
        }
      }

      // Auto-create broker commission if a broker is assigned
      if (dealInput.brokerId) {
        await createBrokerCommission(db, {
          dealId: deal.id,
          brokerId: dealInput.brokerId,
          teamId: teamId!,
          fundingAmount: dealInput.fundingAmount,
          commissionType: dealInput.commissionType,
          commissionPercentage: dealInput.commissionPercentage,
          commissionAmount: dealInput.commissionAmount,
        });
      }

      return deal;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMcaDealById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        pageSize: z.number().min(1).max(100).optional(),
        merchantId: z.string().nullish(),
        status: z.string().nullish(),
        sort: z.array(z.string()).nullish(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMcaDeals(db, {
        teamId: teamId!,
        cursor: input.cursor,
        pageSize: input.pageSize,
        merchantId: input.merchantId,
        status: input.status,
        sort: input.sort,
      });
    }),

  stats: protectedProcedure
    .input(z.object({ merchantId: z.string().optional() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMcaDealStats(db, {
        teamId: teamId!,
        merchantId: input.merchantId,
      });
    }),

  statusBreakdown: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getMcaDealStatusBreakdown(db, {
        teamId: teamId!,
      });
    },
  ),

  recordPayment: memberProcedure
    .input(
      z.object({
        dealId: z.string().uuid(),
        amount: z.number().positive(),
        paymentDate: z.string(),
        paymentType: z.enum(["ach", "wire", "check", "manual", "other"]).default("ach"),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const deal = await getMcaDealById(db, { id: input.dealId, teamId: teamId! });
      if (!deal) {
        throw new Error("Deal not found");
      }

      const balanceBefore = deal.currentBalance ?? 0;
      const balanceAfter = balanceBefore - input.amount;

      const payment = await createMcaPayment(db, {
        teamId: teamId!,
        dealId: input.dealId,
        amount: input.amount,
        paymentDate: input.paymentDate,
        paymentType: input.paymentType,
        status: "completed",
        description: input.note,
        balanceBefore,
        balanceAfter,
      });

      await updateMcaDeal(db, {
        id: input.dealId,
        teamId: teamId!,
        currentBalance: balanceAfter,
        totalPaid: (deal.totalPaid ?? 0) + input.amount,
      });

      // Recalculate risk score for this deal
      if (payment) {
        await calculateRiskScore(db, input.dealId, teamId!, payment.id);
      }

      return payment;
    }),

  updateStatus: memberProcedure
    .input(
      z.object({
        dealId: z.string().uuid(),
        status: z.enum(["active", "paid_off", "defaulted", "paused", "late", "in_collections"]),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateMcaDeal(db, {
        id: input.dealId,
        teamId: teamId!,
        status: input.status,
      });
    }),
});
