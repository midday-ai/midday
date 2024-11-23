import { hc } from "hono/client";
import type { AppType } from "..";

export const client = hc<AppType>(
  `${process.env.NEXT_PUBLIC_ENGINE_API_URL}/`,
  {
    headers: {
      Authorization: `Bearer ${process.env.MIDDAY_ENGINE_API_KEY}`,
    },
  },
);
