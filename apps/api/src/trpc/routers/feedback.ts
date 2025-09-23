import { createChatFeedbackSchema } from "@api/schemas/feedback";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { createChatFeedback } from "@midday/db/queries";

export const chatFeedbackRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createChatFeedbackSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return createChatFeedback(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
      });
    }),
});
