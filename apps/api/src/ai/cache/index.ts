import { createCached } from "@ai-sdk-tools/cache";

export const cached = createCached({
  debug: process.env.NODE_ENV === "development",
});
