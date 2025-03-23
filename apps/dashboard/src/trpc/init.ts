import type { Client } from "@midday/supabase/types";
import { initTRPC } from "@trpc/server";
import { cache } from "react";

// Modify the context creator to handle the Supabase client creation
export type CreateContextOptions = {
  supabase?: Client;
};

export const createTRPCContext = cache(
  async (opts: CreateContextOptions = {}) => {
    /**
     * @see: https://trpc.io/docs/server/context
     */
    return {
      supabase: opts.supabase,
    };
  },
);

const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
  allowOutsideOfServer: true,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
