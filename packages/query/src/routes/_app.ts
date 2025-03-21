import { t } from "../strpc";
import { transactionsRouter } from "./transactions";

/**
 * Main app router that combines all domain routers
 */
export const appRouter = t.router({
  transactions: transactionsRouter,
  // Add more domain routers here
  // teams: teamsRouter,
});

/**
 * Type for the full router
 */
export type AppRouter = typeof appRouter;

/**
 * Server router client - use this for type-safe server access
 */
export const stRPC = appRouter;
