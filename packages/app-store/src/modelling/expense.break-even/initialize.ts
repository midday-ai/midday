import { configureDefaultInitializer } from "../../config/initialize";

export const initialize = configureDefaultInitializer("break-even-analysis", {
  timeout: 10000,
  retries: 5,
});
