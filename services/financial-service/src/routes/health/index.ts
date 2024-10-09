import { App } from "@/hono/app";
import { registerV1GetHealth } from "./v1_get_health";

const registerHealthApi = (app: App): void => {
  registerV1GetHealth(app);
}

export { registerHealthApi };
