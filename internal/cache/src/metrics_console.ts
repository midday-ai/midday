/**
 * ConsoleMetrics is an example implementation to write cache metrics to stdout
 */
export class ConsoleMetrics<
  TMetric extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Emit  a new metric event
   *
   */
  public emit(metric: TMetric): void {
    console.info(JSON.stringify(metric));
  }

  /**
   * flush persists all metrics to durable storage
   */
  public flush(): Promise<void> {
    return Promise.resolve();
  }
}
