import type { AppType } from "@midday/engine";
import { hc } from "hono/client";

export const engineClient = hc<AppType>(
  `${process.env.NEXT_PUBLIC_ENGINE_URL}/`,
  {
    headers: {
      Authorization: `Bearer ${process.env.MIDDAY_ENGINE_API_KEY}`,
    },
  },
);
