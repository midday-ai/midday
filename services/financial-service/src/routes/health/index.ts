import { App } from "@/hono/app";
import { registerV1GetHealth } from "./v1_get_health";

/**
 * Registers the health API routes for the application.
 * 
 * @param app - The Hono application instance.
 */
const registerHealthApi = (app: App): void => {
  registerV1GetHealth(app);
}

/**
 * Module for registering health-related API routes.
 * 
 * @module HealthApi
 */
export { registerHealthApi };
