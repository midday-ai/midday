import type { BatchRunHandle } from "@trigger.dev/sdk/v3";

interface TriggerTask<T> {
  batchTriggerAndWait: (
    items: { payload: T }[],
    options?: any & { delaySeconds?: number },
  ) => Promise<BatchRunHandle<string, T, void>>;
}

export async function triggerSequenceAndWait<T>(
  items: T[],
  task: TriggerTask<T>,
  options?: any & { delaySeconds?: number },
) {
  const { delaySeconds = 60, ...restOptions } = options ?? {};

  const batchItems = items.map((item, i) => ({
    payload: item,
    options: {
      ...restOptions,
      delay:
        delaySeconds >= 60
          ? `${Math.round((i * delaySeconds) / 60)}min` // Use minutes for delays >= 60 seconds
          : `${i * delaySeconds}s`, // Use seconds for delays < 60 seconds
    },
  }));

  return task.batchTriggerAndWait(batchItems, restOptions);
}
