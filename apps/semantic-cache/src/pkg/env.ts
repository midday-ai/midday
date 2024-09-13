import type { Ai, VectorizeIndex } from "@cloudflare/workers-types";
import { z } from "zod";

export const zEnv = z.object({
  VERSION: z.string().default("unknown"),
  /**
   * Useful in development where using a subdomain on localhost is annoying.
   *
   * Do not use this in production.
   */
  FALLBACK_SUBDOMAIN: z.string().optional(),
  DATABASE_HOST: z.string(),
  DATABASE_USERNAME: z.string(),
  DATABASE_PASSWORD: z.string(),
  ENVIRONMENT: z
    .enum(["development", "preview", "canary", "production"])
    .default("development"),
  TINYBIRD_PROXY_URL: z.string().optional(),
  TINYBIRD_PROXY_TOKEN: z.string().optional(),
  TINYBIRD_TOKEN: z.string().optional(),
  APEX_DOMAIN: z.string().default("llm.unkey.io"),
  EMIT_METRICS_LOGS: z
    .string()
    .optional()
    .default("true")
    .transform((v) => {
      return v === "true";
    }),

  VECTORIZE_INDEX: z.custom<VectorizeIndex>((v) => typeof v === "object"),

  // They don't ship types :(
  RL_FREE: z.custom<{
    limit: (o: { key: string }) => Promise<{ success: boolean }>;
  }>((v) => typeof v === "object"),
  AI: z.custom<Ai>((v) => typeof v === "object"),
});

export type Env = z.infer<typeof zEnv>;
