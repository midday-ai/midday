import { z } from "zod";

/**
 * Schema for API event analytics.
 * @typedef {Object} ApiEventSchema
 */
export const apiEventSchema = z.object({
  /** Unique identifier for the request */
  request_id: z.string(),
  /** Timestamp of the event (in milliseconds since epoch) */
  time: z.number().int(),
  /** Host that received the request */
  host: z.string(),
  /** HTTP method used for the request */
  method: z.string(),
  /** Path of the requested resource */
  path: z.string(),
  /** Array of request headers */
  request_headers: z.array(z.string()),
  /** Body of the request */
  request_body: z.string(),
  /** HTTP status code of the response */
  response_status: z.number().int(),
  /** Array of response headers */
  response_headers: z.array(z.string()),
  /** Body of the response */
  response_body: z.string(),
  /** Error message, if any */
  error: z.string().optional().default(""),
  /** Latency of the service in milliseconds */
  service_latency: z.number().int(),
  /** User agent string of the client */
  user_agent: z.string(),
  /** IP address of the client */
  ip_address: z.string(),
});

/**
 * Schema for general event analytics.
 * @typedef {Object} EventSchema
 */
export const eventSchema = z.object({
  /** Timestamp of the event */
  time: z.number(),
  /** Model used for the event */
  model: z.string(),
  /** Whether the response was streamed */
  stream: z.boolean(),
  /** The query or prompt used */
  query: z.string(),
  /** Vector representation of the query */
  vector: z.array(z.number()).default([]),
  /** The response generated */
  response: z.string(),
  /** Whether the response was cached */
  cache: z.boolean(),
  /** Latency information for various stages of processing */
  latency: z.object({
    /** End to end latency of our running code (in milliseconds) */
    service: z.number().int(),
    /** Time taken for embedding generation (in milliseconds) */
    embeddings: z.number().int(),
    /** Time taken for vectorization (in milliseconds) */
    vectorize: z.number().int(),
    /** Time taken for inference, if applicable (in milliseconds) */
    inference: z.number().int().optional(),
    /** Time taken for cache operations (in milliseconds) */
    cache: z.number().int(),
  }),
  /** Number of tokens in the response */
  tokens: z.number(),
  /** Unique identifier for the request */
  requestId: z.string(),
  /** Identifier for the workspace */
  workspaceId: z.string(),
  /** Identifier for the gateway */
  gatewayId: z.string(),
});

/**
 * Schema for SDK event analytics.
 * @typedef {Object} SdkEventSchema
 */
export const sdkEventSchema = z.object({
  /** Unique identifier for the request */
  requestId: z.string(),
  /** Timestamp of the event (in milliseconds since epoch) */
  time: z.number().int(),
  /** Runtime environment of the SDK */
  runtime: z.string(),
  /** Platform on which the SDK is running */
  platform: z.string(),
  /** Array of version information (e.g., SDK version, dependencies) */
  versions: z.array(z.string()),
});

/** Type representing a full analytics event */
export type AnalyticsEvent = z.infer<typeof eventSchema>;

/** Type representing an API analytics event */
export type ApiAnalyticsEvent = z.infer<typeof apiEventSchema>;

/** Type representing an SDK analytics event */
export type SdkAnalyticsEvent = z.infer<typeof sdkEventSchema>;

/**
 * Type representing the initial analytics event with a subset of properties.
 * This is typically used when creating a new event before all data is available.
 */
export type InitialAnalyticsEvent = Pick<
  AnalyticsEvent,
  "time" | "model" | "stream" | "query" | "vector"
>;
