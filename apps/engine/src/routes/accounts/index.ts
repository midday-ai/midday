import { ErrorSchema } from "@/common/schema";
import { app } from "@/index";
import { Provider } from "@/providers";
import { createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { AccountSchema, AccountsParamsSchema, AccountsSchema } from "./schema";

const indexRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get Accounts",
  request: {
    query: AccountsParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AccountsSchema,
        },
      },
      description: "Retrieve accounts",
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

app.openapi(indexRoute, async (c) => {
  const envs = env(c);

  const { provider, accessToken, institutionId, id, countryCode } =
    c.req.valid("query");

  try {
    const api = new Provider({
      provider,
      fetcher: c?.env?.TELLER_CERT,
      envs,
    });

    const data = await api.getAccounts({
      id,
      countryCode,
      accessToken,
      institutionId,
    });

    return c.json(
      {
        data,
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

const balanceRoute = createRoute({
  method: "get",
  path: "/balance",
  summary: "Get Account Balance",
  request: {
    query: AccountsParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AccountSchema,
        },
      },
      description: "Retrieve account balance",
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

app.openapi(balanceRoute, async (c) => {
  const envs = env(c);
  const { provider, accessToken, accountId } = c.req.query();

  try {
    const api = new Provider({
      provider,
      fetcher: c.env.TELLER_CERT,
      envs,
    });

    const data = await api.getAccountBalance({
      accessToken,
      accountId,
    });

    return c.json(
      {
        data,
      },
      200
    );
  } catch (error) {
    console.log(error);

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
