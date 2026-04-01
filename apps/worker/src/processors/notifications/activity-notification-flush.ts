import { flushDueActivityNotificationBatches } from "@midday/bot";
import type { Job } from "bullmq";
import { z } from "zod";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

const flushPayloadSchema = z.object({});

export class ActivityNotificationFlushProcessor extends BaseProcessor<
  z.infer<typeof flushPayloadSchema>
> {
  protected override getPayloadSchema() {
    return flushPayloadSchema;
  }

  async process(_job: Job<z.infer<typeof flushPayloadSchema>>) {
    await flushDueActivityNotificationBatches(getDb());

    return { flushed: true };
  }
}
