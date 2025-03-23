import type { Database } from "@midday/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initTRPC } from "@trpc/server";

// Define the context type that will be passed to all procedures
export interface Context {
  supabase: SupabaseClient<Database>;
}

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Export the core components
export const router = t.router;
export const procedure = t.procedure;
export const middleware = t.middleware;
