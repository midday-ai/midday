import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const trackerRouter = createTRPCRouter({
  get: protectedProcedure.query(async () => {
    return [];
  }),
});
