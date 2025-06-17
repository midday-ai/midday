export interface QueueConfig {
  name: string;
  concurrencyLimit?: number;
  priority?: number;
  attempts?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
}

export function queue(config: QueueConfig): QueueConfig {
  return {
    concurrencyLimit: 5,
    priority: 1,
    attempts: 3,
    removeOnComplete: 50,
    removeOnFail: 50,
    ...config,
  };
}
