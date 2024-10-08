/**
 * Bindings type representing environment variables and resources available to the application.
 */
export type Bindings = {
  /** KV namespace for key-value storage */
  KV: KVNamespace;

  /** R2 bucket for general storage */
  STORAGE: R2Bucket;

  /** R2 bucket specifically for storing bank statements */
  BANK_STATEMENTS: R2Bucket;

  /** Fetcher for Teller certification */
  TELLER_CERT: Fetcher;

  /** Secret key for API authentication */
  API_SECRET_KEY: string;

  /** GoCardless secret identifier */
  GOCARDLESS_SECRET_ID: string;

  /** GoCardless secret key */
  GOCARDLESS_SECRET_KEY: string;

  /** Plaid client ID */
  PLAID_CLIENT_ID: string;

  /** Plaid environment (e.g., 'sandbox', 'development', 'production') */
  PLAID_ENVIRONMENT: string;

  /** Plaid secret key */
  PLAID_SECRET: string;

  /** Typesense API key for authentication */
  TYPESENSE_API_KEY: string;

  /** Typesense endpoint for Australia region */
  TYPESENSE_ENDPOINT_AU: string;

  /** Typesense endpoint for European region */
  TYPESENSE_ENDPOINT_EU: string;

  /** Typesense endpoint for United States region */
  TYPESENSE_ENDPOINT_US: string;

  /** Default Typesense endpoint */
  TYPESENSE_ENDPOINT: string;

  /** Upstash Redis REST API token */
  UPSTASH_REDIS_REST_TOKEN: string;

  /** Upstash Redis REST API URL */
  UPSTASH_REDIS_REST_URL: string;

  /** Stripe secret key for API authentication */
  STRIPE_SECRET_KEY: string;
};
