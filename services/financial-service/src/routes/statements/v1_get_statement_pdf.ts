import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { Provider } from "@/providers";
import { createErrorResponse } from "@/utils/error";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { StatementPdfParamsSchema } from "./schema";

const route = createRoute({
    method: "get",
    path: "/statements/pdf",
    summary: "Get Statement PDF",
    request: {
        query: StatementPdfParamsSchema,
    },
    responses: {
        200: {
            content: {
                "application/pdf": {
                    schema: {
                        type: "string",
                        format: "binary",
                    },
                },
            },
            description: "Retrieve statement PDF",
        },
        ...ErrorResponses
    },
});

export type GetStatementPdfRoute = typeof route;
export type GetStatementPdfRequest = z.infer<typeof route.request.query>;
export type GetStatementPdfResponse = z.infer<z.ZodType<typeof route.responses["200"]["content"]["application/pdf"]["schema"]>>;

export const registerStatementPdfApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);
        const { provider, accessToken, statementId, accountId, userId, teamId } =
            c.req.valid("query");

        const api = new Provider({
            provider,
            kv: c.env.KV,
            fetcher: c.env.TELLER_CERT,
            r2: c.env.BANK_STATEMENTS,
            envs,
        });

        try {
            const { pdf, filename } = await api.getStatementPdf({
                accessToken,
                statementId,
                accountId,
                userId,
                teamId,
            });

            c.header("Content-Type", "application/pdf");
            c.header("Content-Disposition", `attachment; filename="${filename}"`);
            return new Response(pdf, {
                headers: c.res.headers,
            });
        } catch (error) {
            const { message, code } = createErrorResponse(error, c.get("requestId"));
            return c.json({
                error: {
                    message,
                    docs: "https://api.example.com/docs/errors",
                    requestId: c.get("requestId"),
                    code,
                }
            }, 400);
        }
    });
}
