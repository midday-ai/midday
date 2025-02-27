import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { EnableBankingApi } from "@/providers/enablebanking/enablebanking-api";
import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import { createErrorResponse } from "@/utils/error";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  EnableBankingLinkBodySchema,
  EnableBankingLinkResponseSchema,
  EnableBankingSessionQuerySchema,
  EnableBankingSessionSchema,
  GoCardLessAgreementBodySchema,
  GoCardLessAgreementSchema,
  GoCardLessExchangeBodySchema,
  GoCardLessExchangeSchema,
  GoCardLessLinkBodySchema,
  GoCardLessLinkSchema,
  PlaidExchangeBodySchema,
  PlaidExchangeSchema,
  PlaidLinkBodySchema,
  PlaidLinkSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>()
  .openapi(
    createRoute({
      method: "post",
      path: "/plaid/link",
      summary: "Auth Link (Plaid)",
      request: {
        body: {
          content: {
            "application/json": {
              schema: PlaidLinkBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: PlaidLinkSchema,
            },
          },
          description: "Retrieve Link",
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
    }),
    async (c) => {
      const envs = env(c);

      const { userId, language, accessToken } = await c.req.json();

      const api = new PlaidApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const { data } = await api.linkTokenCreate({
          userId,
          language,
          accessToken,
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
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/plaid/exchange",
      summary: "Exchange token (Plaid)",
      request: {
        body: {
          content: {
            "application/json": {
              schema: PlaidExchangeBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: PlaidExchangeSchema,
            },
          },
          description: "Retrieve Exchange",
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
    }),
    async (c) => {
      const envs = env(c);

      const { token } = await c.req.json();

      const api = new PlaidApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.itemPublicTokenExchange({
          publicToken: token,
        });

        return c.json(data, 200);
      } catch (error) {
        const errorResponse = createErrorResponse(error, c.get("requestId"));

        return c.json(errorResponse, 400);
      }
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/gocardless/link",
      summary: "Auth link (GoCardLess)",
      request: {
        body: {
          content: {
            "application/json": {
              schema: GoCardLessLinkBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GoCardLessLinkSchema,
            },
          },
          description: "Retrieve Link",
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
    }),
    async (c) => {
      const envs = env(c);

      const { institutionId, agreement, redirect, reference } =
        await c.req.json();

      const api = new GoCardLessApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.buildLink({
          institutionId,
          agreement,
          redirect,
          reference,
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
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/gocardless/agreement",
      summary: "Agreement (GoCardLess)",
      request: {
        body: {
          content: {
            "application/json": {
              schema: GoCardLessAgreementBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GoCardLessAgreementSchema,
            },
          },
          description: "Retrieve Agreement",
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
    }),
    async (c) => {
      const envs = env(c);

      const { institutionId, transactionTotalDays, reference } =
        await c.req.json();

      const api = new GoCardLessApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.createEndUserAgreement({
          institutionId,
          transactionTotalDays,
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
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/gocardless/exchange",
      summary: "Exchange token (GoCardLess)",
      request: {
        body: {
          content: {
            "application/json": {
              schema: GoCardLessExchangeBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GoCardLessExchangeSchema,
            },
          },
          description: "Retrieve Exchange",
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
    }),
    async (c) => {
      const envs = env(c);

      const { institutionId, transactionTotalDays } = await c.req.json();

      const api = new GoCardLessApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.createEndUserAgreement({
          institutionId,
          transactionTotalDays,
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
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/enablebanking/link",
      summary: "Auth link (EnableBanking)",
      request: {
        body: {
          content: {
            "application/json": {
              schema: EnableBankingLinkBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EnableBankingLinkResponseSchema,
            },
          },
          description: "Retrieve Link",
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
    }),
    async (c) => {
      const envs = env(c);

      const { institutionId, country, teamId, validUntil, state } =
        await c.req.json();

      const api = new EnableBankingApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.authenticate({
          institutionId,
          country,
          teamId,
          validUntil,
          state,
        });

        return c.json(
          {
            data: {
              url: data.url,
            },
          },
          200,
        );
      } catch (error) {
        const errorResponse = createErrorResponse(error, c.get("requestId"));

        return c.json(errorResponse, 400);
      }
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/enablebanking/exchange",
      summary: "Exchange code (EnableBanking)",
      request: {
        query: EnableBankingSessionQuerySchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EnableBankingSessionSchema,
            },
          },
          description: "Retrieve Session",
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
    }),
    async (c) => {
      const envs = env(c);

      const { code } = c.req.query();

      const api = new EnableBankingApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.exchangeCode(code);

        return c.json(
          {
            data: {
              session_id: data.session_id,
              expires_at: data.access.valid_until,
            },
          },
          200,
        );
      } catch (error) {
        const errorResponse = createErrorResponse(error, c.get("requestId"));
        console.log("errorResponse", errorResponse);

        return c.json(errorResponse, 400);
      }
    },
  );

export default app;
