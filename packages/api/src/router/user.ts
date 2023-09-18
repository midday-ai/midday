import { eq } from "drizzle-orm";
import { insertUserSchema, users } from "@midday/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  update: protectedProcedure
    .input(insertUserSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(users).set(input).where(eq(users.id, ctx.user.uid));
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.uid),
    });
  }),
});
