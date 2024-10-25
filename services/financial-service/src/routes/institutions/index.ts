import { App } from "@/hono/app";
import { registerV1GetInstitutionApi } from "./v1_get_institutions";
import { registerUpdateInstitutionUsageRoute } from "./v1_update_institution_usage";

/**
 * Registers all institution-related API routes to the given Hono app instance.
 *
 * This function serves as a central point for registering various institution-related
 * API endpoints. It currently includes routes for getting institution information
 * and updating institution usage.
 *
 * @param {App} app - The Hono app instance to which the routes will be registered.
 *
 * @example
 * import { Hono } from 'hono';
 * import { registerInstitutionsApi } from './institutions';
 *
 * const app = new Hono();
 * registerInstitutionsApi(app);
 */
const registerInstitutionsApi = (app: App) => {
  registerV1GetInstitutionApi(app);
  registerUpdateInstitutionUsageRoute(app);
};

export { registerInstitutionsApi };

/**
 * @fileoverview This module contains the main function for registering
 * institution-related API routes in a Hono application.
 *
 * It imports and uses two specific route registration functions:
 * - {@link registerV1GetInstitutionApi} for handling GET requests related to institutions
 * - {@link registerUpdateInstitutionUsageRoute} for handling updates to institution usage
 *
 * The main export of this module is the {@link registerInstitutionsApi} function,
 * which should be used to register all institution routes at once.
 */
