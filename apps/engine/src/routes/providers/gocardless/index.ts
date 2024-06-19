import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  ExchangeParamsSchema,
  ExchangeSchema,
  LinkParamsSchema,
  LinkSchema,
} from "./schema";

const app = new OpenAPIHono();

const linkRoute = createRoute({
  method: "post",
  path: "/gocardless/link",
  request: {
    query: LinkParamsSchema,
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
  request: {
    query: ExchangeParamsSchema,
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
  //   const envs = env(c);
  //   const { provider, accessToken, institutionId, id, countryCode } =
  //     c.req.query();
  //   try {
  //     const api = new Provider({
  //       provider,
  //       fetcher: c.env.TELLER_CERT,
  //       envs,
  //     });
  //     const data = await api.getAccounts({
  //       id,
  //       countryCode,
  //       accessToken,
  //       institutionId,
  //     });
  //     return c.json(
  //       {
  //         data,
  //       },
  //       200
  //     );
  //   } catch (error) {
  //     return c.json(
  //       {
  //         message: error.message,
  //       },
  //       400
  //     );
  //   }
});

app.openapi(exchangeRoute, async (c) => {
  //   const envs = env(c);
  //   const { provider, accessToken, institutionId, id, countryCode } =
  //     c.req.query();
  //   try {
  //     const api = new Provider({
  //       provider,
  //       fetcher: c.env.TELLER_CERT,
  //       envs,
  //     });
  //     const data = await api.getAccounts({
  //       id,
  //       countryCode,
  //       accessToken,
  //       institutionId,
  //     });
  //     return c.json(
  //       {
  //         data,
  //       },
  //       200
  //     );
  //   } catch (error) {
  //     return c.json(
  //       {
  //         message: error.message,
  //       },
  //       400
  //     );
  //   }
});

export default app;
