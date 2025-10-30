import { createChatFeedbackSchema } from "@api/schemas/feedback";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";

export const chatFeedbackRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createChatFeedbackSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return null;
    }),
});
