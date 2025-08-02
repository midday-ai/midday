import type { BatchRunHandle } from "@trigger.dev/sdk";

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
      delay: `${i * delaySeconds}s`, // Use seconds for precise timing
    },
  }));

  return task.batchTriggerAndWait(batchItems, restOptions);
}
