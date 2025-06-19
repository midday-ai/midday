import { createCallerFactory } from "@midday/api/trpc/init";
import { appRouter } from "@midday/api/trpc/routers/_app";
import { connectDb } from "@midday/db/client";
import { createClient } from "@midday/supabase/server";

/**
 * Creates a server-side tRPC caller for system-to-system calls
 * This bypasses authentication and allows calling tRPC procedures from webhooks, cron jobs, etc.
 *
 * @param teamId - Optional team ID. Use when you need team-specific context, omit for system-level operations
 */
export async function createServerTRPCClient(teamId?: string) {
  const db = await connectDb();
  const supabase = await createClient({ admin: true });

  const caller = createCallerFactory(appRouter)({
    session: {
      user: {
        id: "system",
        email: "system@midday.ai",
        full_name: "System",
      },
    },
    supabase,
    db,
    geo: {
      ip: null,
      country: null,
      city: null,
    },
    teamId: teamId || undefined,
  });

  return caller;
}

/**
 * Convenience wrapper for one-off tRPC calls
 * Use this when you need to make a single call and don't need to reuse the client
 *
 * @param teamId - Optional team ID. Use when you need team-specific context, omit for system-level operations
 */
export async function callTRPCProcedure<T>(
  procedureCall: (
    caller: Awaited<ReturnType<typeof createServerTRPCClient>>,
  ) => Promise<T>,
  teamId?: string,
): Promise<T> {
  const caller = await createServerTRPCClient(teamId);
  return procedureCall(caller);
}
