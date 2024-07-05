import { OpenAPIHono } from "@hono/zod-openapi";

type Bindings = {
  KV: KVNamespace;
  TELLER_CERT: Fetcher;
  GOCARDLESS_SECRET_KEY: string;
  GOCARDLESS_SECRET_ID: string;
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENVIRONMENT: string;
};

export const app = new OpenAPIHono<{ Bindings: Bindings }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          source: "error",
        },
        422,
      );
    }
  },
});
