import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
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

const app = new OpenAPIHono<{ Bindings: Bindings }>();

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

const agreementGoCardLessRoute = createRoute({
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

  const { userId, language, accessToken } = await c.req.json();

  const api = new PlaidApi({
    kv: c.env.KV,
    envs,
  });

  const data = await api.linkTokenCreate({
    userId,
    language,
    accessToken,
  });

  return c.json(data, 200);
});

app.openapi(exchangePlaidRoute, async (c) => {
  const envs = env(c);

  const { token } = await c.req.json();

  const api = new PlaidApi({
    kv: c.env.KV,
    envs,
  });

  const data = await api.itemPublicTokenExchange({
    publicToken: token,
  });

  return c.json(data, 200);
});

app.openapi(linkGoCardLessRoute, async (c) => {
  const envs = env(c);

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
      data,
    },
    200,
  );
});

app.openapi(exchangeGoCardLessRoute, async (c) => {
  const envs = env(c);

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
      data,
    },
    200,
  );
});

app.openapi(agreementGoCardLessRoute, async (c) => {
  const envs = env(c);

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
      data,
    },
    200,
  );
});

export default app;
