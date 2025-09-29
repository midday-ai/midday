import { getRunwaySchema } from "@api/schemas/widgets";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { getRunway, getTopRevenueClient } from "@midday/db/queries";

export const widgetsRouter = createTRPCRouter({
  getRunway: protectedProcedure
    .input(getRunwaySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const runway = await getRunway(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      return {
        result: runway,
        toolCall: {
          toolName: "getBurnRateAnalysis",
          toolParams: {
            from: input.from,
            to: input.to,
            currency: input.currency,
          },
        },
      };
    }),

  getTopCustomer: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    const topCustomer = await getTopRevenueClient(db, {
      teamId: teamId!,
    });

    return {
      result: topCustomer,
      // toolCall: {
      //   toolName: "getCustomers",
      // },
    };
  }),
});
