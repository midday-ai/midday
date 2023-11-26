import { client } from "@/trigger";
import { Jobs } from "../constants";

export const scheduler = client.defineDynamicSchedule({
  id: Jobs.TRANSACTION_SCHEDULER,
});
