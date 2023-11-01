import { TriggerClient } from "@trigger.dev/sdk";

export const client = new TriggerClient({
  id: "midday-client",
  apiKey: process.env.TRIGGER_API_KEY,
});
