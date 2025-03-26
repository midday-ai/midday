import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getCategoriesQuery } from "@midday/supabase/queries";

export const transactionCategoriesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getCategoriesQuery(supabase, {
      teamId,
    });

    return data;
  }),

  // createCategory: protectedProcedure
  //   .input(createCategorySchema)
  //   .mutation(async ({ input, ctx: { supabase, teamId } }) => {
  //     return createCategory(supabase, {
  //       ...input,
  //       teamId,
  //     });
  //   }),
});
