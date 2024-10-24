import { Analytics } from '@/analytics';
import { ServiceCache } from '@/cache';
import { APIKeyRepository } from '@/data/apiKeyRepository';
import { UserRepository } from '@/data/userRepository';
import { DrizzleDB } from '@/db/client';
import { User } from '@/db/schema';
import { Env } from '@/env';
import { Logger } from '@/logger';
import { Metrics } from '@/metric';

/**
 * Represents the context for various services used in the application.
 */
export type ServiceContext = {
    /** Database instance for interacting with the application's data. */
    db: DrizzleDB;
    /** Logger instance for recording application events and errors. */
    logger: Logger;
    /** Cache service for improving application performance. */
    cache: ServiceCache;
    /** Metrics service for tracking application usage and performance. */
    metrics: Metrics;
    /** Analytics service for tracking user behavior and application usage. */
    analytics: Analytics
    // TODO: add analytics client to pass api usage
    // TODO: add audit log client to log user actions and store in a nosql db
    // TODO: add usage limit client to check if user has exceeded their usage limits
};

export type RepositoryTypes = {
    apiKey: APIKeyRepository;
    user: UserRepository;
};

export type Repository = {
    [K in keyof RepositoryTypes]: RepositoryTypes[K];
};

/**
 * Represents the environment and context for Hono application requests.
 */
export interface HonoEnv {
    /** Environment bindings, typically containing configuration and secrets. */
    Bindings: Env;
    /** Variables available during request processing. */
    Variables: {
        /** Unique identifier for the current isolate. */
        isolateId: string;
        /** Timestamp when the current isolate was created. */
        isolateCreatedAt: number;
        /** Unique identifier for the current request. */
        requestId: string;
        /** Timestamp when the current request was started. */
        requestStartedAt: number;
        /** Context for metrics collection and tracking. */
        metricsContext: {
            /** Optional key identifier for metrics. */
            keyId?: string;
            /** Additional key-value pairs for metrics context. */
            [key: string]: unknown;
        };
        /** Services available for use during request processing. */
        ctx: ServiceContext;
        /** Repository instances for interacting with the application's data. */
        repo: Repository;
        /**
         * IP address or region information of the client making the request.
         */
        location: string;
        /** User agent string of the client making the request. */
        userAgent?: string;
        /** User object representing the authenticated user for the request. */
        user: User;
    };
}
