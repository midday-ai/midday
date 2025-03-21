import { appRouter } from "./routes/_app";
import { t } from "./strpc";

/**
 * Type for the full router
 */
export type AppRouter = typeof appRouter;

/**
 * Server router client - use this for type-safe server access
 */
export const stRPC = appRouter;

/**
 * Export the router builder for external use
 */
export { t };
