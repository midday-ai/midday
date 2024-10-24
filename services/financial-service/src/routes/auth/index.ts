import { App } from "@/hono/app";
import { registerV1GoCardLessAgreementApi } from "./v1_gocardless_agreement_api";
import { registerV1GoCardLessExchangeApi } from "./v1_gocardless_exchange_api";
import { registerV1GoCardLessLinkApi } from "./v1_gocardless_link_api";
import { registerV1ApisPlaidExchangeTokenApi } from "./v1_plaid_exchange_token_api";
import { registerV1ApisPlaidLinkAccountsApi } from "./v1_plaid_link_account_api";

/**
 * Registers all authentication-related APIs for the application.
 *
 * This function is responsible for setting up various authentication endpoints
 * for both GoCardless and Plaid services. It centralizes the registration of
 * these APIs, making it easier to manage and maintain authentication-related
 * routes in one place.
 *
 * @param {App} app - The main application instance to which the APIs will be registered.
 *
 * @remarks
 * The following APIs are registered:
 * - GoCardless Link API
 * - GoCardless Agreement API
 * - GoCardless Exchange API
 * - Plaid Link Accounts API
 * - Plaid Exchange Token API
 *
 * Each of these APIs is registered using its respective registration function,
 * which is imported from separate modules to keep the codebase modular and maintainable.
 */
const registerAuthApi = (app: App) => {
  registerV1GoCardLessLinkApi(app);
  registerV1GoCardLessAgreementApi(app);
  registerV1GoCardLessExchangeApi(app);
  registerV1ApisPlaidLinkAccountsApi(app);
  registerV1ApisPlaidExchangeTokenApi(app);
};

export { registerAuthApi };

/**
 * @fileoverview
 * This module serves as the central point for registering all authentication-related
 * APIs in the application. It imports and aggregates various API registration functions
 * for both GoCardless and Plaid services, providing a single entry point to set up
 * all authentication routes.
 *
 * By centralizing the registration of these APIs, this module simplifies the process
 * of adding or removing authentication endpoints and ensures consistency in how
 * these APIs are integrated into the main application.
 */
