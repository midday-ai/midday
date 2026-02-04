import { OpenAPIHono } from "@hono/zod-openapi";
import { createMiddleware } from "hono/factory";
import type { Context } from "../../rest/types";

export interface TestAppOptions {
  teamId?: string;
  userId?: string;
}

/**
 * Creates an isolated Hono test app with mocked auth middleware.
 * Use this for REST API integration tests.
 */
export function createTestApp(options: TestAppOptions = {}) {
  const { teamId = "test-team-id", userId = "test-user-id" } = options;

  const app = new OpenAPIHono<Context>();

  // Mock auth middleware - inject test team/user IDs
  app.use(
    "*",
    createMiddleware<Context>(async (c, next) => {
      c.set("teamId", teamId);
      c.set("session", {
        user: {
          id: userId,
          email: "test@example.com",
        },
      });
      c.set("db", {} as Context["Variables"]["db"]); // Mock DB instance - actual queries are mocked at module level
      // Set all scopes for testing (grants full access)
      c.set("scopes", [
        "transactions.read",
        "transactions.write",
        "invoices.read",
        "invoices.write",
        "customers.read",
        "customers.write",
        "bank_accounts.read",
        "bank_accounts.write",
      ] as Context["Variables"]["scopes"]);
      await next();
    }),
  );

  return app;
}
