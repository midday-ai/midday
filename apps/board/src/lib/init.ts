import { startAdmin } from "./server";

let initialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Ensure queues are initialized with timeout protection
 * Uses a shared promise to prevent multiple concurrent initializations
 */
export async function ensureInitialized() {
  // Skip initialization during build time (when REDIS_QUEUE_URL might not be available)
  // Check if we're in a build context by checking for Next.js build indicators
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build" ||
    !process.env.REDIS_QUEUE_URL
  ) {
    console.log(
      "[ensureInitialized] Skipping initialization during build or missing REDIS_QUEUE_URL",
    );
    return;
  }

  if (initialized) {
    return;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    try {
      await initializationPromise;
      return;
    } catch (error) {
      // If previous initialization failed, try again
      initializationPromise = null;
    }
  }

  // Create initialization promise with timeout
  // Use longer timeout in production (30s) vs development (10s)
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;
  const timeout = isProduction ? 30000 : 10000;

  initializationPromise = Promise.race([
    startAdmin(),
    new Promise<void>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Queue initialization timeout after ${timeout / 1000} seconds`,
            ),
          ),
        timeout,
      ),
    ),
  ]) as Promise<void>;

  try {
    await initializationPromise;
    initialized = true;
    initializationPromise = null;
  } catch (error) {
    console.error("Failed to initialize Queue Board:", error);
    initializationPromise = null;
    // Don't throw - allow the request to continue even if initialization fails
    // The queues might still work if Redis connection recovers
    throw error;
  }
}
