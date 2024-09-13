import { Log, type LogSchema } from "@internal/logs";
import type { Metric } from "@internal/metrics";

import type { Metrics } from "./interface";

export class LogdrainMetrics implements Metrics {
  private readonly requestId: string;
  private readonly environment: LogSchema["environment"];

  constructor(opts: {
    requestId: string;
    environment: LogSchema["environment"];
  }) {
    this.requestId = opts.requestId;
    this.environment = opts.environment;
  }

  public emit(metric: Metric): void {
    const log = new Log({
      environment: this.environment,
      application: "semantic-cache",
      requestId: this.requestId,
      type: "metric",
      time: Date.now(),
      metric,
    });

    console.info(log.toString());
  }

  public async flush(): Promise<void> {
    return Promise.resolve();
  }
}
