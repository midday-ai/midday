import { client } from "../client";
import { Jobs } from "../constants";

export const schedulerV2 = client.defineDynamicSchedule({
  id: Jobs.TRANSACTION_SCHEDULER_V2,
});
