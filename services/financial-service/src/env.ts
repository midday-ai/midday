import type { UserActionMessageBody } from "@/message/user-action-message";
import {
  D1Database,
  Fetcher,
  KVNamespace,
  Queue,
  R2Bucket,
  RateLimit,
} from "@cloudflare/workers-types";
import { z } from "zod";

export let zEnv = z.object({
  VERSION: z.string().default("unknown"),
  DB: z.custom<D1Database>((ns) => typeof ns === "object"),
  KV: z.custom<KVNamespace>((ns) => typeof ns === "object"),
  STORAGE: z.custom<R2Bucket>((ns) => typeof ns === "object"),
  BANK_STATEMENTS: z.custom<R2Bucket>((ns) => typeof ns === "object"),
  RATE_LIMITER: z.custom<RateLimit>((ns) => typeof ns === "object"),
  TELLER_CERT: z.custom<Fetcher>((ns) => typeof ns === "object").optional(),
  USER_ACTIONS_QUEUE: z
    .custom<Queue<UserActionMessageBody>>((q) => typeof q === "object")
    .optional(),
  API_SECRET_KEY: z.string(),
  GOCARDLESS_SECRET_ID: z.string(),
  GOCARDLESS_SECRET_KEY: z.string(),
  PLAID_CLIENT_ID: z.string(),
  PLAID_ENVIRONMENT: z.string(),
  PLAID_SECRET: z.string(),
  TYPESENSE_API_KEY: z.string(),
  TYPESENSE_ENDPOINT_AU: z.string(),
  TYPESENSE_ENDPOINT_EU: z.string(),
  TYPESENSE_ENDPOINT_US: z.string(),
  TYPESENSE_ENDPOINT: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  UPSTASH_REDIS_REST_URL: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  UNKEY_API_KEY: z.string(),
  CLOUDFLARE_API_KEY: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  ENVIRONMENT: z
    .enum(["development", "preview", "canary", "production"])
    .default("development"),
  PLATFORM_PREFIX: z.string().default("solomonai_platform"),
});

export type Env = z.infer<typeof zEnv>;
