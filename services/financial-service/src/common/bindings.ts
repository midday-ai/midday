import { Logger } from '@/logger';
import {  DrizzleDB } from '../db';
import { User } from '@/db/schema';

/**
 * Bindings type representing environment variables and resources available to the application.
 */
export interface Bindings {
  DB: D1Database;
  KV: KVNamespace;
  STORAGE: R2Bucket;
  BANK_STATEMENTS: R2Bucket;
  TELLER_CERT: Fetcher;
  API_SECRET_KEY: string;
  GOCARDLESS_SECRET_ID: string;
  GOCARDLESS_SECRET_KEY: string;
  PLAID_CLIENT_ID: string;
  PLAID_ENVIRONMENT: string;
  PLAID_SECRET: string;
  TYPESENSE_API_KEY: string;
  TYPESENSE_ENDPOINT_AU: string;
  TYPESENSE_ENDPOINT_EU: string;
  TYPESENSE_ENDPOINT_US: string;
  TYPESENSE_ENDPOINT: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  UPSTASH_REDIS_REST_URL: string;
  STRIPE_SECRET_KEY: string;
  UNKEY_API_KEY: string;
  ENVIRONMENT: string;
}

export type ServiceContext = {
  db: DrizzleDB;
  logger: Logger;
};

/**
 * Context type representing the application context.
 */
export interface Context {
  Bindings: Bindings;
  executionCtx: ExecutionContext;
  Variables: {
    isolateId: string;
    isolateCreatedAt: number;
    requestId: string;
    metricsContext: {
      keyId?: string;
      [key: string]: unknown;
    };
    services: ServiceContext;
    /**
     * IP address or region information
     */
    location: string;
    userAgent?: string;
    user: User;
  };
}
