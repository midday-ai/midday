import Midday from "@midday-ai/engine";

export const engine = new Midday({
  environment: process.env.MIDDAY_ENGINE_ENVIRONMENT as
    | "production"
    | "staging"
    | "development"
    | undefined,
});
