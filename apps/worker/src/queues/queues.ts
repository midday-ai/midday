import { queue } from "@worker/core/queue";

export const QUEUE_NAMES = {
  EMAIL: "email",
  DOCUMENTS: "documents",
} as const;

export const emailQueue = queue({
  name: QUEUE_NAMES.EMAIL,
  concurrencyLimit: 25,
  priority: 2,
  removeOnComplete: 100,
});

export const documentsQueue = queue({
  name: QUEUE_NAMES.DOCUMENTS,
  concurrencyLimit: 50,
  priority: 1,
  removeOnComplete: 100,
});
