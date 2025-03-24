import { initTRPC } from "@trpc/server";
import { cache } from "react";

export const createTRPCContext = cache(async () => {
  return { userId: "user_123" };
});

const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
