import { App } from "@/hono/app";
import { registerV1ApisDeleteAccountsApi } from "./v1_delete_accounts_api";
import { registerV1ApisGetAccountBalanceApi } from "./v1_get_account_balance_api";
import { registerV1ApisGetAccountsApi } from "./v1_get_accounts_api";

/**
 * Registers all account-related API routes for the application.
 * 
 * This function serves as a central point for registering various account-related
 * API endpoints. It calls individual registration functions for different
 * account operations, such as retrieving accounts, deleting accounts, and
 * getting account balances.
 *
 * @param {App} app - The main application instance to which the routes will be added.
 *                    This should be an instance of the custom App type, which is likely
 *                    an extension of the Hono framework.
 *
 * @returns {void} This function doesn't return anything; it modifies the app in-place.
 *
 * @example
 * import { App } from "@/hono/app";
 * import { registerAccountsApi } from "./accounts";
 *
 * const app = new App();
 * registerAccountsApi(app);
 *
 * @see {@link registerV1ApisGetAccountsApi}
 * @see {@link registerV1ApisDeleteAccountsApi}
 * @see {@link registerV1ApisGetAccountBalanceApi}
 */
const registerAccountsApi = (app: App): void => {
  registerV1ApisGetAccountsApi(app);
  registerV1ApisDeleteAccountsApi(app);
  registerV1ApisGetAccountBalanceApi(app);
};

export { registerAccountsApi };
