import { createCached } from "@ai-sdk-tools/cache";
import { getContext } from "../context";

export const cached = createCached({
  debug: process.env.NODE_ENV === "development",
  cacheKey: () => {
    const context = getContext();
    return `${context.user.userId}:${context.user.teamId}`;
  },
});
