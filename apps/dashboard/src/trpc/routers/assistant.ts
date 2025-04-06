import { getLatestChat } from "@/actions/ai/storage";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const assistantRouter = createTRPCRouter({
  history: protectedProcedure.query(async ({ ctx: { teamId, session } }) => {
    const data = await getLatestChat({
      teamId: teamId!,
      userId: session.user.id,
    });

    return data ?? null;
  }),
});
