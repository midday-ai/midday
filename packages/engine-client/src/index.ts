import type { AppType } from "@midday/engine";
import { hc } from "hono/client";

// Create typed client using TypeScript Project References
// See: https://catalins.tech/hono-rpc-in-monorepos/
// TypeScript Project References allow proper type resolution across package boundaries
export const client = hc<AppType>(`${process.env.ENGINE_API_URL}/`, {
  headers: {
    Authorization: `Bearer ${process.env.ENGINE_API_KEY}`,
  },
});

export type EngineClient = typeof client;
