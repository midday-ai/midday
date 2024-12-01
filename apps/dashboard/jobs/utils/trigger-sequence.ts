import type { BatchRunHandle, TaskRunOptions } from "@trigger.dev/sdk/v3";

interface TriggerTask<T> {
  batchTriggerAndWait: (
    items: { payload: T }[],
    options?: TaskRunOptions & { delayMinutes?: number },
  ) => Promise<BatchRunHandle<string, T, void>>;
}

export async function triggerSequenceAndWait<T>(
  items: T[],
  task: TriggerTask<T>,
  options?: TaskRunOptions & { delayMinutes?: number },
) {
  const { delayMinutes = 1, ...restOptions } = options ?? {};

  const batchItems = items.map((item, i) => ({
    payload: item,
    options: {
      ...restOptions,
      delay: `${i * delayMinutes}min`,
    },
  }));

  return task.batchTriggerAndWait(batchItems, restOptions);
}
