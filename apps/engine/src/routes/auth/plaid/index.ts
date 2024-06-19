import { ErrorSchema } from "@/common/schema";
import { PlaidApi } from "@/providers/plaid/plaid-api";
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
  path: "/plaid/link",
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
  path: "/plaid/exchange",
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
      },
      400
    );
  }
});

app.openapi(exchangeRoute, async (c) => {
  const envs = env(c);

  try {
    const { token } = await c.req.json();

    const api = new PlaidApi({
      kv: c.env.KV,
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
      },
      400
    );
  }
});

export default app;
