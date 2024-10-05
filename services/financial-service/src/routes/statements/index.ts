import { Provider } from "@/providers";
import { createErrorResponse } from "@/utils/error";
import { ErrorSchema } from "@/common/schema";
import {
  StatementsParamsSchema,
  StatementsSchema,
  StatementPdfParamsSchema,
} from "./schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import type { Bindings } from "@/common/bindings";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const statementsRoute = createRoute({
  method: "get",
  path: "/statements",
  summary: "Get Statements",
  request: {
    query: StatementsParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatementsSchema,
        },
      },
      description: "Retrieve statements",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

const statementPdfRoute = createRoute({
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
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(statementsRoute, async (c) => {
  const envs = env(c);
  const { provider, accessToken, accountId, userId, teamId } =
    c.req.valid("query");

  const api = new Provider({
    provider,
    kv: c.env.KV,
    fetcher: c.env.TELLER_CERT,
    r2: c.env.BANK_STATEMENTS,
    envs,
  });

  try {
    const data = await api.getStatements({
      accessToken,
      accountId,
      userId,
      teamId,
    });

    return c.json(
      {
        data,
      },
      200,
    );
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

app.openapi(statementPdfRoute, async (c) => {
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
    return c.body(pdf as any);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});
