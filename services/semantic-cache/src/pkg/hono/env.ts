import type { Env } from "@/pkg/env";
import type { Logger } from "@internal/worker-logging";

import type { Analytics } from "../analytics";
import type { Metrics } from "../metrics";

export type ServiceContext = {
  metrics: Metrics;
  logger: Logger;
  analytics: Analytics;
};

export type HonoEnv = {
  Bindings: Env;
  Variables: {
    requestId: string;
    services: ServiceContext;
    /**
     * IP address or region information
     */
    location: string;
    userAgent?: string;

    tokens?: Promise<number>;
    response?: Promise<string>;
    query?: string;
    vector?: Array<number>;
    cacheHit?: boolean;
    cacheLatency?: number;
    embeddingsLatency?: number;
    vectorizeLatency?: number;
    inferenceLatency?: number;
    platformType?: "business" | "consumer" | "solopreneur";
  };
};
