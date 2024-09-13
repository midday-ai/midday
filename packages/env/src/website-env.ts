import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment configuration using t3-oss/env-nextjs
 */
export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_URL: z.string().optional().transform((v) => (v ? `https://${v}` : undefined)),
    PORT: z.coerce.number().default(3000),
  },
  server: {
    PLAIN_API_KEY: z.string(),
    UPSTASH_REDIS_REST_URL: z.string(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
    SUPABASE_SERVICE_KEY: z.string(),
    RESEND_API_KEY: z.string(),
    LOOPS_API_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_LOGSNAG_TOKEN: z.string(),
    NEXT_PUBLIC_LOGSNAG_PROJECT: z.string(),
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_SUPABASE_ID: z.string(),
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID: z.string(),

    // Feature flags
    NEXT_PUBLIC_ENABLE_DARK_MODE: z.coerce.boolean().default(false),
    NEXT_PUBLIC_ENABLE_NEWSLETTER: z.coerce.boolean().default(true),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    PORT: process.env.PORT,
    PLAIN_API_KEY: process.env.PLAIN_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LOOPS_API_KEY: process.env.LOOPS_API_KEY,
    NEXT_PUBLIC_LOGSNAG_TOKEN: process.env.NEXT_PUBLIC_LOGSNAG_TOKEN,
    NEXT_PUBLIC_LOGSNAG_PROJECT: process.env.NEXT_PUBLIC_LOGSNAG_PROJECT,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ID: process.env.NEXT_PUBLIC_SUPABASE_ID,
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID,
    // Feature flags
    NEXT_PUBLIC_ENABLE_DARK_MODE: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE,
    NEXT_PUBLIC_ENABLE_NEWSLETTER: process.env.NEXT_PUBLIC_ENABLE_NEWSLETTER,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

/**
 * Exported environment variables
 */
export const environment = env;

/**
 * Feature flags configuration
 */
export const featureFlags = {
  isDarkModeEnabled: env.NEXT_PUBLIC_ENABLE_DARK_MODE,
  isNewsletterEnabled: env.NEXT_PUBLIC_ENABLE_NEWSLETTER,
};