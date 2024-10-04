import { z } from "zod";

export const metricSchema = z.discriminatedUnion("metric", [
  z.object({
    metric: z.literal("metric.cache.read"),
    key: z.string(),
    hit: z.boolean(),
    status: z.enum(["fresh", "stale"]).optional(),
    latency: z.number(),
    tier: z.string(),
    namespace: z.string(),
  }),
  z.object({
    metric: z.literal("metric.cache.write"),
    key: z.string(),
    tier: z.string(),
    latency: z.number(),
    namespace: z.string(),
  }),
  z.object({
    metric: z.literal("metric.cache.remove"),
    key: z.string(),
    tier: z.string(),
    namespace: z.string(),
    latency: z.number(),
  }),
  z.object({
    metric: z.literal("metric.cache.size"),
    tier: z.literal("memory"),
    size: z.number(),
  }),
  z.object({
    metric: z.literal("metric.fetch.egress"),
    url: z.string(),
    latency: z.number(),
    status: z.number(),
  }),
  z.object({
    metric: z.literal("metric.key.verification"),
    valid: z.boolean(),
    code: z.string(),
    workspaceId: z.string().optional(),
    apiId: z.string().optional(),
    keyId: z.string().optional(),
  }),
  z.object({
    metric: z.literal("metric.http.request"),
    host: z.string(),
    path: z.string(),
    method: z.string(),
    status: z.number(),
    error: z.string().optional(),
    serviceLatency: z.number(),
    // ms since worker initilized for the first time
    // a non zero value means the worker is reused
    isolateLifetime: z.number(),
    isolateId: z.string(),
    // Regional data might be different on non-cloudflare deployments
    colo: z.string().optional(),
    continent: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    userAgent: z.string().optional(),
    fromAgent: z.string().optional(),
    context: z.record(z.unknown()),
  }),
  z.object({
    metric: z.literal("metric.db.read"),
    query: z.enum([
      "getKeyAndApiByHash",
      "loadFromOrigin",
      "getKeysByKeyAuthId",
    ]),
    latency: z.number(),
  }),
  z.object({
    metric: z.literal("metric.ratelimit"),
    workspaceId: z.string(),
    namespaceId: z.string().optional(),
    identifier: z.string(),
    latency: z.number(),
    mode: z.enum(["sync", "async"]),
    success: z.boolean().optional(),
    error: z.boolean().optional(),
    source: z.enum(["agent", "durable_object"]),
  }),
  z.object({
    metric: z.literal("metric.usagelimit"),
    keyId: z.string(),
    latency: z.number(),
  }),
  z.object({
    metric: z.literal("metric.ratelimit.accuracy"),
    workspaceId: z.string(),
    namespaceId: z.string().optional(),
    identifier: z.string(),
    responded: z.boolean(),
    correct: z.boolean(),
  }),

  z.object({
    metric: z.literal("metric.vault.latency"),
    op: z.enum([
      "encrypt",
      "encryptBulk",
      "decrypt",
      "reEncrypt",
      "createDEK",
      "liveness",
      "reEncryptDEKs",
    ]),
    latency: z.number(),
  }),
  z.object({
    metric: z.literal("metric.agent.latency"),
    op: z.enum([
      "liveness",
      "ratelimit",
      "multiRatelimit",
      "encrypt",
      "decrypt",
    ]),
    latency: z.number(),
  }),
  z.object({
    metric: z.literal("metric.server.latency"),
    status: z.number(),
    country: z.string(),
    continent: z.string(),
    latency: z.number(),
    platform: z.string(),
    colo: z.string(),
  }),
  z.object({
    metric: z.literal("metric.db.transaction"),
    name: z.string(),
    path: z.string().optional(),
    latency: z.number(),
    attempts: z.number().optional(),
  }),
]);

export type Metric = z.infer<typeof metricSchema>;

export const logContext = z.object({
  requestId: z.string(),
});

const commonFields = z.object({
  environment: z.enum([
    "test",
    "development",
    "preview",
    "canary",
    "production",
    "unknown",
  ]),
  application: z.enum(["api", "semantic-cache", "agent", "logdrain", "vault"]),
});

export const logSchema = z.discriminatedUnion("type", [
  commonFields.merge(
    z.object({
      type: z.literal("log"),
      level: z.enum(["debug", "info", "warn", "error", "fatal"]),
      requestId: z.string(),
      time: z.number(),
      message: z.string(),
      context: z.record(z.any()),
    }),
  ),
  commonFields.merge(
    z.object({
      type: z.literal("metric"),
      requestId: z.string(),
      time: z.number(),
      metric: metricSchema,
    }),
  ),
]);
export type LogSchema = z.infer<typeof logSchema>;
export class Log<TLog extends LogSchema = LogSchema> {
  public readonly log: TLog;

  constructor(log: TLog) {
    this.log = log;
  }

  public toString(): string {
    return JSON.stringify(this.log);
  }
}
