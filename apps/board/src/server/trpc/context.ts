import { ensureInitialized } from "@/lib/init";

export async function createTRPCContext() {
  // Skip initialization during build time
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build" ||
    !process.env.REDIS_QUEUE_URL
  ) {
    return {};
  }

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

