import type { RunHandle, TaskRunOptions } from "@trigger.dev/sdk/v3";

interface TriggerTask<T> {
  trigger: (
    payload: T,
    options?: TaskRunOptions & { delayMinutes?: number },
  ) => Promise<RunHandle<string, T, void>>;
}

export async function triggerSequence<T>(
  items: T[],
  task: TriggerTask<T>,
  options?: TaskRunOptions & { delayMinutes?: number },
) {
  const { delayMinutes = 1, ...restOptions } = options ?? {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item) continue;

    await task.trigger(item, {
      ...restOptions,
      delay: `${i * delayMinutes}min`,
    });
  }
}
