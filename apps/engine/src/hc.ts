import { hc } from "hono/client";
import type { appRoutes } from "./index";

// assign the client to a variable to calculate the type when compiling
const client = hc<typeof appRoutes>("");
export type Client = typeof client;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<typeof appRoutes>(...args);
