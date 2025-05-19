import { hcWithType } from "@midday/engine/hc";

export const engineClient = hcWithType(`${process.env.ENGINE_API_URL}/`, {
  headers: {
    Authorization: `Bearer ${process.env.MIDDAY_ENGINE_API_KEY}`,
  },
});
