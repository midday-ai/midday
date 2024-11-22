import type { RunHandle } from "@trigger.dev/sdk/v3";

interface TriggerTask<T> {
  trigger: (input: { payload: T; options?: { delay?: string } }) => Promise<
    RunHandle<string, T, void>
  >;
}

type TaskRunOptions = {
  delay?: number;
};

export async function triggerSequence<T>(
  items: T[],
  task: TriggerTask<T>,
  options?: TaskRunOptions,
) {
  const delay = options?.delay ?? 5;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item) continue;

    await task.trigger({
      payload: item,
      options: {
        delay: `${i * delay}min`,
      },
    });
  }
}
