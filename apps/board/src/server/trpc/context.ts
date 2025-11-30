import { ensureInitialized } from "@/lib/init";

export async function createTRPCContext() {
  // Ensure queues are initialized (non-blocking - will fail gracefully if Redis is unavailable)
  try {
    await ensureInitialized();
  } catch (error) {
    // Log error but don't block the request
    // The procedures will handle missing queues gracefully
    console.error("[TRPC Context] Queue initialization failed:", error);
  }

  return {};
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

