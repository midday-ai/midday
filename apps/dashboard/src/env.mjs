import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  shared: {
    VERCEL_URL: z
      .string()
      .optional()
      .transform((v) => (v ? `https://${v}` : undefined)),
    PORT: z.coerce.number().default(3000),
  },
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app isn't
   * built with invalid env vars.
   */
  server: {
    GOOGLE_APPLICATION_INVOICE_PROCESSOR_ID: z.string(),
    GOOGLE_APPLICATION_EXPENSE_PROCESSOR_ID: z.string(),
    PLAIN_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    SUPABASE_SERVICE_KEY: z.string(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
    UPSTASH_REDIS_REST_URL: z.string(),
    LOOPS_ENDPOINT: z.string(),
    LOOPS_API_KEY: z.string(),
    GOCARDLESS_SECRET_ID: z.string(),
    GOCARDLESS_SECRET_KEY: z.string(),
    NOVU_API_KEY: z.string(),
    RESEND_API_KEY: z.string(),
    BASELIME_SERVICE: z.string(),
    BASELIME_API_KEY: z.string(),
    OPENPANEL_SECRET_KEY: z.string(),
    ENGINE_API_ENDPOINT: z.string(),
    ENGINE_API_SECRET: z.string(),
    WEBHOOK_SECRET_KEY: z.string(),
    SENTRY_DSN: z.string(),
  },
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: z.string(),
    NEXT_PUBLIC_SUPABASE_ID: z.string(),
    NEXT_PUBLIC_TRIGGER_API_KEY: z.string(),
    NEXT_PUBLIC_TELLER_APPLICATION_ID: z.string(),
    NEXT_PUBLIC_TELLER_ENVIRONMENT: z.string(),
    NEXT_PUBLIC_PLAID_ENVIRONMENT: z.string(),
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID: z.string(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ID: process.env.NEXT_PUBLIC_SUPABASE_ID,
    NEXT_PUBLIC_TELLER_APPLICATION_ID:
      process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID,
    NEXT_PUBLIC_TELLER_ENVIRONMENT: process.env.NEXT_PUBLIC_TELLER_ENVIRONMENT,
    NEXT_PUBLIC_PLAID_ENVIRONMENT: process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PORT: process.env.PORT,
    LOOPS_ENDPOINT: process.env.LOOPS_ENDPOINT,
    LOOPS_API_KEY: process.env.LOOPS_API_KEY,
    GOCARDLESS_SECRET_ID: process.env.GOCARDLESS_SECRET_ID,
    GOCARDLESS_SECRET_KEY: process.env.GOCARDLESS_SECRET_KEY,
    NOVU_API_KEY: process.env.NOVU_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER:
      process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER,
    NEXT_PUBLIC_TRIGGER_API_KEY: process.env.NEXT_PUBLIC_TRIGGER_API_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PLAIN_API_KEY: process.env.PLAIN_API_KEY,
    GOOGLE_APPLICATION_INVOICE_PROCESSOR_ID: process.env.PLAIN_API_KEY,
    GOOGLE_APPLICATION_EXPENSE_PROCESSOR_ID:
      process.env.GOOGLE_APPLICATION_EXPENSE_PROCESSOR_ID,
    BASELIME_SERVICE: process.env.BASELIME_SERVICE,
    BASELIME_API_KEY: process.env.BASELIME_API_KEY,
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID:
      process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID,
    OPENPANEL_SECRET_KEY: process.env.OPENPANEL_SECRET_KEY,
    ENGINE_API_ENDPOINT: process.env.ENGINE_API_ENDPOINT,
    ENGINE_API_SECRET: process.env.ENGINE_API_SECRET,
    WEBHOOK_SECRET_KEY: process.env.WEBHOOK_SECRET_KEY,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
