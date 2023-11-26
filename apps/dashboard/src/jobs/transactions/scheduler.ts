import { client } from "@/trigger";

export const scheduler = client.defineDynamicSchedule({
  id: "transaction-scheduler",
});
