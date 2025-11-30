import { startAdmin } from "./server";

let initialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Ensure queues are initialized with timeout protection
 * Uses a shared promise to prevent multiple concurrent initializations
 */
export async function ensureInitialized() {
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
  initializationPromise = Promise.race([
    startAdmin(),
    new Promise<void>((_, reject) =>
      setTimeout(
        () => reject(new Error("Queue initialization timeout after 10 seconds")),
        10000,
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
