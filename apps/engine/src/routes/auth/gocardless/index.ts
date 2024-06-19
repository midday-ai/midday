import { ErrorSchema } from "@/common/schema";
import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  ExchangeBodySchema,
  ExchangeSchema,
  LinkBodySchema,
  LinkSchema,
} from "./schema";

const app = new OpenAPIHono();

const linkRoute = createRoute({
  method: "post",
  path: "/gocardless/link",
  summary: "Auth link (GoCardLess)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LinkBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LinkSchema,
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
});

const exchangeRoute = createRoute({
  method: "post",
  path: "/gocardless/exchange",
  summary: "Exchange token (GoCardLess)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ExchangeBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ExchangeSchema,
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
});

app.openapi(linkRoute, async (c) => {
  const envs = env(c);

  try {
    const { institutionId, agreement, redirect } = await c.req.json();

    const api = new GoCardLessApi({
      kv: c.env.KV,
      envs,
    });

    const data = await api.buildLink({
      institutionId,
      agreement,
      redirect,
    });

    return c.json(
      {
        link: data.link,
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        message: error.message,
      },
      400
    );
  }
});

app.openapi(exchangeRoute, async (c) => {
  const envs = env(c);

  try {
    const { institutionId, transactionTotalDays } = await c.req.json();

    const api = new GoCardLessApi({
      kv: c.env.KV,
      envs,
    });

    const data = await api.createEndUserAgreement({
      institutionId,
      transactionTotalDays,
    });

    return c.json(
      {
        id: data.id,
        access_valid_for_days: data.access_valid_for_days,
        institution_id: data.institution_id,
        max_historical_days: data.max_historical_days,
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        message: error.message,
      },
      400
    );
  }
});

export default app;
