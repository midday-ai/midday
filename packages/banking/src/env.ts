import { z } from "zod";

const schema = z.object({
  PLAID_CLIENT_ID: z.string().min(1),
  PLAID_SECRET: z.string().min(1),
  PLAID_ENVIRONMENT: z.string().default("production"),
  GOCARDLESS_SECRET_ID: z.string().min(1),
  GOCARDLESS_SECRET_KEY: z.string().min(1),
  ENABLEBANKING_APPLICATION_ID: z.string().min(1),
  ENABLE_BANKING_KEY_CONTENT: z.string().min(1),
  ENABLEBANKING_REDIRECT_URL: z.string().min(1),
  TELLER_CERT_BASE64: z.string().min(1),
  TELLER_KEY_BASE64: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  LOGO_DEV_TOKEN: z.string().min(1),
});

function readEnv<K extends keyof typeof schema.shape>(name: K) {
  return schema.shape[name].parse(process.env[name] || undefined);
}

// Validate optional integrations when used, so unrelated routes can start locally.
export const env = {
  get PLAID_CLIENT_ID() {
    return readEnv("PLAID_CLIENT_ID");
  },
  get PLAID_SECRET() {
    return readEnv("PLAID_SECRET");
  },
  get PLAID_ENVIRONMENT() {
    return readEnv("PLAID_ENVIRONMENT");
  },
  get GOCARDLESS_SECRET_ID() {
    return readEnv("GOCARDLESS_SECRET_ID");
  },
  get GOCARDLESS_SECRET_KEY() {
    return readEnv("GOCARDLESS_SECRET_KEY");
  },
  get ENABLEBANKING_APPLICATION_ID() {
    return readEnv("ENABLEBANKING_APPLICATION_ID");
  },
  get ENABLE_BANKING_KEY_CONTENT() {
    return readEnv("ENABLE_BANKING_KEY_CONTENT");
  },
  get ENABLEBANKING_REDIRECT_URL() {
    return readEnv("ENABLEBANKING_REDIRECT_URL");
  },
  get TELLER_CERT_BASE64() {
    return readEnv("TELLER_CERT_BASE64");
  },
  get TELLER_KEY_BASE64() {
    return readEnv("TELLER_KEY_BASE64");
  },
  get R2_ENDPOINT() {
    return readEnv("R2_ENDPOINT");
  },
  get R2_ACCESS_KEY_ID() {
    return readEnv("R2_ACCESS_KEY_ID");
  },
  get R2_SECRET_ACCESS_KEY() {
    return readEnv("R2_SECRET_ACCESS_KEY");
  },
  get R2_BUCKET_NAME() {
    return readEnv("R2_BUCKET_NAME");
  },
  get LOGO_DEV_TOKEN() {
    return readEnv("LOGO_DEV_TOKEN");
  },
};
