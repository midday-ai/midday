/**
 * Import the App type from the Hono application module.
 */
import { App } from "@/hono/app";

/**
 * Import the function to register recurring transactions API endpoints.
 */
import { registerRecurringTransactionsApi } from "./v1_recurring_transactions_api";
import { registerRegularTransactionsApi } from "./v1_transactions_api";

/**
 * Registers all transaction-related API endpoints for the application.
 * 
 * This function serves as the main entry point for setting up transaction routes.
 * It calls other specialized registration functions to set up various
 * transaction-related endpoints.
 *
 * @param {App} app - The Hono application instance to which the routes will be added.
 * 
 * @throws {Error} Potentially throws errors if there are issues registering routes.
 * 
 * @example
 * const app = new Hono();
 * registerTransactionsApi(app);
 */
const registerTransactionsApi = (app: App) => {
    registerRegularTransactionsApi(app);
    registerRecurringTransactionsApi(app);
}

export { registerTransactionsApi };
