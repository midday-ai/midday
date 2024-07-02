import { ErrorSchema } from "@/common/schema";
import { app } from "@/index";
import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import { createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  GoCardLessExchangeBodySchema,
  GoCardLessExchangeSchema,
  GoCardLessLinkBodySchema,
  GoCardLessLinkSchema,
  PlaidExchangeBodySchema,
  PlaidExchangeSchema,
  PlaidLinkBodySchema,
  PlaidLinkSchema,
} from "./schema";

const linkPlaidRoute = createRoute({
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
});

const exchangePlaidRoute = createRoute({
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
});

const linkGoCardLessRoute = createRoute({
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
});

const exchangeGoCardLessRoute = createRoute({
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
});

app.openapi(linkPlaidRoute, async (c) => {
  const envs = env(c);

  try {
    const { userId, language } = await c.req.json();

    const api = new PlaidApi({
      kv: c.env.KV,
      envs,
    });

    const { data } = await api.linkTokenCreate({
      userId,
      language,
    });

    return c.json(
      {
        link_token: data.link_token,
        expiration: data.expiration,
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        message: error.message,
        code: 400,
      },
      400
    );
  }
});

app.openapi(exchangePlaidRoute, async (c) => {
  const envs = env(c);

  try {
    const { token } = await c.req.json();

    const api = new PlaidApi({
      kv: c?.env?.KV,
      envs,
    });

    const data = await api.itemPublicTokenExchange({
      publicToken: token,
    });

    return c.json(
      {
        access_token: data.data.access_token,
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        message: error.message,
        code: 400,
      },
      400
    );
  }
});

app.openapi(linkGoCardLessRoute, async (c) => {
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
        code: 400,
      },
      400
    );
  }
});

app.openapi(exchangeGoCardLessRoute, async (c) => {
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
        code: 400,
      },
      400
    );
  }
});

export default app;
