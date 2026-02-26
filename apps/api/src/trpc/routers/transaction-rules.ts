import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  applyTransactionRules,
  createTransactionRule,
  deleteTransactionRule,
  getTransactionRules,
  updateTransactionRule,
} from "@midday/db/queries";
import { z } from "@hono/zod-openapi";

const createRuleSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
  merchantMatch: z.string().nullable().optional(),
  merchantMatchType: z.enum(["contains", "exact", "starts_with"]).optional(),
  amountOperator: z.enum(["eq", "gt", "lt", "between"]).nullable().optional(),
  amountValue: z.number().nullable().optional(),
  amountValueMax: z.number().nullable().optional(),
  accountId: z.string().uuid().nullable().optional(),
  setCategorySlug: z.string().nullable().optional(),
  setMerchantName: z.string().nullable().optional(),
  addTagIds: z.array(z.string().uuid()).optional(),
  setExcluded: z.boolean().nullable().optional(),
  setAssignedId: z.string().uuid().nullable().optional(),
  setDealCode: z.string().nullable().optional(),
  autoResolveDeal: z.boolean().optional(),
  dateStart: z.string().nullable().optional(),
  dateEnd: z.string().nullable().optional(),
});

const updateRuleSchema = createRuleSchema.partial().extend({
  id: z.string().uuid(),
});

const deleteRuleSchema = z.object({
  id: z.string().uuid(),
});

const applyRulesSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1).max(500),
});

export const transactionRulesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTransactionRules(db, { teamId: teamId! });
  }),

  create: protectedProcedure
    .input(createRuleSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return createTransactionRule(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  update: protectedProcedure
    .input(updateRuleSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateTransactionRule(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteRuleSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteTransactionRule(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  applyRules: protectedProcedure
    .input(applyRulesSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return applyTransactionRules(db, {
        teamId: teamId!,
        transactionIds: input.transactionIds,
      });
    }),
});
