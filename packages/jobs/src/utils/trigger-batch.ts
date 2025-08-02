import type { BatchRunHandle } from "@trigger.dev/sdk";

const BATCH_SIZE = 100;

interface BatchItem<T> {
  payload: T;
}

interface BatchTriggerTask<T> {
  batchTrigger: (
    items: BatchItem<T>[],
  ) => Promise<BatchRunHandle<string, T, void>>;
}

export async function triggerBatch<T>(data: T[], task: BatchTriggerTask<T>) {
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);

    await task.batchTrigger(
      chunk.map((item) => ({
        payload: item,
      })),
    );
  }
}
