import { ensureInitialized } from "@/lib/init";

export async function createTRPCContext() {
  // Ensure queues are initialized
  await ensureInitialized();

  return {};
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

