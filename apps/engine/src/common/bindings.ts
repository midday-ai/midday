export type Bindings = {
  KV: KVNamespace;
  STORAGE: R2Bucket;
  TELLER_CERT: Fetcher;
  GOCARDLESS_SECRET_KEY: string;
  GOCARDLESS_SECRET_ID: string;
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENVIRONMENT: string;
  API_SECRET_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  TYPESENSE_API_KEY: string;
};
