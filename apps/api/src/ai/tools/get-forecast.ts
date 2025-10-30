import { cached } from "@api/ai/cache";
import { tool } from "ai";
import { getForecastSchema } from "./schema";

export const getForecastTool = cached(
  tool({
    description: "Get the forecast analysis for the user's account",
    inputSchema: getForecastSchema,
    execute: async function* () {
      yield { text: "Forecast analysis" };
    },
  }),
);
