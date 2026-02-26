import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  getUnderwritingBuyBox,
  upsertUnderwritingBuyBox,
} from "@midday/db/queries";
import { z } from "@hono/zod-openapi";

const saveBuyBoxSchema = z.object({
  minMonthlyRevenue: z.number().nullable().optional(),
  minTimeInBusiness: z.number().int().nullable().optional(),
  maxExistingPositions: z.number().int().nullable().optional(),
  minAvgDailyBalance: z.number().nullable().optional(),
  maxNsfCount: z.number().int().nullable().optional(),
  excludedIndustries: z.array(z.string()).nullable().optional(),
  minCreditScore: z.number().int().nullable().optional(),
});

export const underwritingRouter = createTRPCRouter({
  getBuyBox: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getUnderwritingBuyBox(db, { teamId: teamId! });
  }),

  saveBuyBox: memberProcedure
    .input(saveBuyBoxSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return upsertUnderwritingBuyBox(db, {
        ...input,
        teamId: teamId!,
      });
    }),
});
