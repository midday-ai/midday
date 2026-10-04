import { getSslConfig } from "@midday/db/ssl";
import { createLoggerWithContext } from "@midday/logger";
import { isLocalBackend } from "@midday/utils/backend";
import { Client } from "pg";
import { RealtimeListener } from "./listener-core";

const logger = createLoggerWithContext("realtime");
export const realtimeListener = new RealtimeListener({
  createClient: () => {
    if (!isLocalBackend())
      throw new Error("LISTEN is only available in the local backend");
    return new Client({
      connectionString:
        process.env.DATABASE_LISTEN_URL || process.env.DATABASE_PRIMARY_URL,
      ssl: getSslConfig(),
      application_name: "midday-realtime",
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
    });
  },
  onError: (error) =>
    logger.warn("Realtime listener interrupted; reconnecting", {
      error: error instanceof Error ? error.message : "Unknown listener error",
    }),
});
