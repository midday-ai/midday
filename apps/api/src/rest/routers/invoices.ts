import { getInvoices } from "@api/db/queries/invoices";
import type { Context } from "@api/rest/types";
import {
  getInvoicesSchema,
  invoicesResponseSchema,
} from "@api/schemas/invoice";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all invoices",
    description: "Retrieve a list of invoices for the authenticated team.",
    tags: ["Invoices"],
    request: {
      query: getInvoicesSchema,
    },
    responses: {
      200: {
        description: "A list of invoices for the authenticated team.",
        content: {
          "application/json": {
            schema: invoicesResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { pageSize, cursor, sort, ...filter } = c.req.valid("query");

    const result = await getInvoices(db, {
      teamId,
      pageSize,
      cursor,
      sort,
      filter,
    });

    console.log(result);

    return c.json(validateResponse(result, invoicesResponseSchema));
  },
);

export const invoicesRouter = app;
