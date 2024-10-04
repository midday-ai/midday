import { Log, type LogSchema } from "../../pkg/logger/log";
import type { Metrics } from "./interface";
import type { Metric } from "./metric";

export class LogdrainMetrics implements Metrics {
  private readonly requestId: string;
  private readonly isolateId?: string;
  private readonly environment: LogSchema["environment"];

  constructor(opts: {
    requestId: string;
    isolateId?: string;
    environment: LogSchema["environment"];
  }) {
    this.requestId = opts.requestId;
    this.isolateId = opts.isolateId;
    this.environment = opts.environment;
  }

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

  public async flush(): Promise<void> {
    return Promise.resolve();
  }
}
