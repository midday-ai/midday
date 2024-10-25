import type { Metrics } from "./interface";
import type { Metric } from "./metric-schema";
export class NoopMetrics implements Metrics {
  public emit(_metric: Metric): Promise<void> {
    return Promise.resolve();
  }

  public async flush(): Promise<void> {}
}
