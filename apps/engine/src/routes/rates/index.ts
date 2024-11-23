import { GeneralErrorSchema } from "@/common/schema";
import { getRates } from "@/utils/rates";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Bindings } from "hono/types";
import { RatesSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Get rates",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: RatesSchema,
          },
        },
        description: "Retrieve rates",
      },
      400: {
        content: {
          "application/json": {
            schema: GeneralErrorSchema,
          },
        },
        description: "Returns an error",
      },
    },
  }),
  async (c) => {
    try {
      const data = await getRates();

      return c.json(
        {
          data,
        },
        200,
      );
    } catch (error) {
      return c.json(
        {
          error: "Internal server error",
          message: "Internal server error",
          requestId: c.get("requestId"),
          code: "400",
        },
        400,
      );
    }
  },
);

export default app;
