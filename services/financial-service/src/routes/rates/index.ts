import { App } from "@/hono/app";
import { registerGetRates } from "./v1_register_get_rates";

/**
 * Registers the rates API endpoints for the application.
 *
 * @param app - The Hono application instance.
 */
const registerRatesApi = (app: App) => {
  registerGetRates(app);
};

export { registerRatesApi };
