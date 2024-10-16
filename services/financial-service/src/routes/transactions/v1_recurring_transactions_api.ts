import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { Provider } from "@/providers";
import { createErrorResponse } from "@/utils/error";
import { createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { GetRecurringTransactionsResponseSchema, RecurringTransactionsParamsSchema } from "./schema";

const route = createRoute({
    tags: ["api", "transactions"],
    operationId: "getRecurringTransactionsApi",
    security: [{ bearerAuth: [] }],
    method: "get",
    path: "/v1/api.transactions/recurring",
    summary: "Get recurring transactions",
    description: "Get recurring transactions",
    request: {
        query: RecurringTransactionsParamsSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: GetRecurringTransactionsResponseSchema,
                },
            },
            description: "Retrieve recurring transactions",
        },
        ...ErrorResponses
    },
});

/**
 * Handler for the recurring transactions route.
 * @param c - The context object containing request and environment information.
 * @returns A JSON response with recurring transaction data or an error.
 */
export const registerRecurringTransactionsApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);
        const { provider, accessToken, accountId } = c.req.valid("query");

        if (provider !== "plaid") {
            return c.json(
                createErrorResponse(
                    new Error("Recurring transactions are only supported for Plaid"),
                    c.get("requestId"),
                ),
                400,
            ) as any; // Type assertion to bypass strict type checking
        }

        const api = new Provider({
            provider,
            kv: c.env.KV,
            envs,
            r2: c.env.STORAGE,
        });

        try {
            const data = await api.getRecurringTransactions({
                accessToken,
                accountId,
            });

            return c.json(
                {
                    data: {
                        inflow: data.inflow || [],
                        outflow: data.outflow || [],
                        last_updated_at: data.last_updated_at || new Date().toISOString(),
                    },
                },
                200,
            );
        } catch (error) {
            const errorResponse = createErrorResponse(error, c.get("requestId"));
            return c.json(errorResponse, 400);
        }
    });
}
