import type { ApiRoutes } from "@midday/engine/src";
import { hc } from "hono/client";

export const client = hc<ApiRoutes>(`${process.env.ENGINE_API_ENDPOINT}/`, {
  headers: {
    Authorization: `Bearer ${process.env.ENGINE_API_SECRET}`,
  },
});
