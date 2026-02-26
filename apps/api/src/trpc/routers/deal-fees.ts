import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  createDealFeeSchema,
  deleteDealFeeSchema,
  getDealFeesSchema,
} from "@api/schemas/disclosures";
import {
  createDealFee,
  deleteDealFee,
  getDealFeesByDeal,
  getTotalFeesByDeal,
} from "@midday/db/queries";

export const dealFeesRouter = createTRPCRouter({
  create: memberProcedure
    .input(createDealFeeSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return createDealFee(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  getByDeal: protectedProcedure
    .input(getDealFeesSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getDealFeesByDeal(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });
    }),

  getTotals: protectedProcedure
    .input(getDealFeesSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getTotalFeesByDeal(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });
    }),

  delete: memberProcedure
    .input(deleteDealFeeSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteDealFee(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),
});
