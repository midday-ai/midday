import { getLatestChat } from "@/actions/ai/storage";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const assistantRouter = createTRPCRouter({
  history: protectedProcedure.query(async () => {
    return getLatestChat();
  }),
});
