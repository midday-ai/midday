import FinancialEngine from "@solomon-ai/financial-engine-sdk";
import { headers } from "next/headers";

export const engine = new FinancialEngine({
  defaultHeaders: {
    "x-api-key": process.env.MIDDAY_ENGINE_API_KEY ?? "SOLOMONAI",
    Authorization: `Bearer ${process.env.MIDDAY_ENGINE_API_KEY ?? "SOLOMONAI"}`,
  },
  baseURL:
    process.env.ENGINE_API_ENDPOINT ?? "https://engine.solomon-ai-platform.com",
});
