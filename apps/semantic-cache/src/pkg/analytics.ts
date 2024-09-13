import { NoopTinybird, Tinybird } from "@chronark/zod-bird";
import { z } from "zod";

export class Analytics {
  public readonly client: Tinybird | NoopTinybird;

  constructor(opts: {
    tinybirdToken?: string;
    tinybirdProxy?: {
      url: string;
      token: string;
    };
  }) {
    this.client = opts.tinybirdProxy
      ? new Tinybird({
          token: opts.tinybirdProxy.token,
          baseUrl: opts.tinybirdProxy.url,
        })
      : opts.tinybirdToken
        ? new Tinybird({ token: opts.tinybirdToken })
        : new NoopTinybird();
  }

  public get ingestLogs() {
    return this.client.buildIngestEndpoint({
      datasource: "semantic_cache__v1",
      event: eventSchema,
    });
  }
}

export const eventSchema = z.object({
  time: z.number(),
  model: z.string(),
  stream: z.boolean(),
  query: z.string(),
  vector: z.array(z.number()).default([]),
  response: z.string(),
  cache: z.boolean(),
  latency: z.object({
    /**
     * End to end latency of our running code
     */
    service: z.number().int(),
    embeddings: z.number().int(),
    vectorize: z.number().int(),
    inference: z.number().int().optional(),
    cache: z.number().int(),
  }),
  tokens: z.number(),
  requestId: z.string(),
  workspaceId: z.string(),
  gatewayId: z.string(),
});

export type AnalyticsEvent = z.infer<typeof eventSchema>;

export type InitialAnalyticsEvent = Pick<
  AnalyticsEvent,
  "time" | "model" | "stream" | "query" | "vector"
>;
