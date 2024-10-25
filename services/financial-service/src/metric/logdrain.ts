import { Log, type LogSchema } from "@/metric/logger";
import type { Metrics } from "./interface";
import type { Metric } from "./metric-schema";

/**
 * LogdrainMetrics class implements the Metrics interface for logging metrics.
 * It provides functionality to emit metrics as logs and flush the metrics.
 */
export class LogdrainMetrics implements Metrics {
  private readonly requestId: string;
  private readonly isolateId?: string;
  private readonly environment: LogSchema["environment"];

  /**
   * Creates an instance of LogdrainMetrics.
   * @param {Object} opts - The options for creating a LogdrainMetrics instance.
   * @param {string} opts.requestId - The ID of the request associated with these metrics.
   * @param {string} [opts.isolateId] - The optional ID of the isolate associated with these metrics.
   * @param {LogSchema["environment"]} opts.environment - The environment in which these metrics are being collected.
   */
  constructor(opts: {
    requestId: string;
    isolateId?: string;
    environment: LogSchema["environment"];
  }) {
    this.requestId = opts.requestId;
    this.isolateId = opts.isolateId;
    this.environment = opts.environment;
  }

  /**
   * Emits a metric by creating a log and writing it to the console.
   * @param {Metric} metric - The metric to be emitted.
   */
  public emit(metric: Metric): void {
    const log = new Log({
      requestId: this.requestId,
      isolateId: this.isolateId,
      environment: this.environment,
      application: "api",
      type: "metric",
      time: Date.now(),
      metric,
    });

    console.info(log.toString());
  }

  /**
   * Flushes any pending metrics.
   * In this implementation, it's a no-op that immediately resolves.
   * @returns {Promise<void>} A promise that resolves when the flush is complete.
   */
  public async flush(): Promise<void> {
    return Promise.resolve();
  }
}
