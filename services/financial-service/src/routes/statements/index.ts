import { App } from "@/hono/app";
import { registerGetStatementsApi } from "./v1_get_statement";
import { registerStatementPdfApi } from "./v1_get_statement_pdf";

/**
 * Registers all statement-related API routes with the given app instance.
 * 
 * @param app - The Hono app instance to register the routes with.
 */
const registerStatementsApi = (app: App) => {
    registerGetStatementsApi(app);
    registerStatementPdfApi(app);
}

/**
 * Module for registering statement-related API routes.
 * 
 * This module exports a function to register all statement-related API routes,
 * including routes for getting statements and statement PDFs.
 */
export { registerStatementsApi };
