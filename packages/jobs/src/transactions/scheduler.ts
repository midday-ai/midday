import { client } from "../client";
import { Jobs } from "../constants";

export const scheduler = client.defineDynamicSchedule({
  id: Jobs.TRANSACTION_SCHEDULER,
});
