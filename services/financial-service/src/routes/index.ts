import { App } from "@/hono/app";
import type { HonoEnv } from "@/hono/env";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerAccountsApi } from "./accounts";
import { registerApiKeysApi } from "./apiKeys";
import authRoutes from "./auth";
import { registerHealthApi } from "./health";
import institutionRoutes from "./institutions";
import ratesRoutes from "./rates";
import transactionsRoutes from "./transactions";

export function setupRoutes(app: App) {
    // register the accounts api route
    registerAccountsApi(app);
    registerHealthApi(app);
    registerApiKeysApi(app);
  app
    .route("/transactions", transactionsRoutes)
    .route("/institutions", institutionRoutes)
    .route("/rates", ratesRoutes)
    .route("/auth", authRoutes);  
}