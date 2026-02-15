import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PLAID_CLIENT_ID: z.string().min(1),
    PLAID_SECRET: z.string().min(1),
    PLAID_ENVIRONMENT: z.string().default("production"),
    GOCARDLESS_SECRET_ID: z.string().min(1),
    GOCARDLESS_SECRET_KEY: z.string().min(1),
    ENABLEBANKING_APPLICATION_ID: z.string().min(1),
    ENABLE_BANKING_KEY_CONTENT: z.string().min(1),
    ENABLEBANKING_REDIRECT_URL: z.string().min(1),
    TELLER_CERT_BASE64: z.string().optional(),
    TELLER_KEY_BASE64: z.string().optional(),
  },
  runtimeEnv: process.env,
});
