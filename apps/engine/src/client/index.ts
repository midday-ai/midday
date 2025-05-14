import type { AppType } from "@/index";
import { hc } from "hono/client";

export const client = hc<AppType>(
  `${process.env.NEXT_PUBLIC_ENGINE_API_URL}/`,
  {
    headers: {
      Authorization: `Bearer ${process.env.MIDDAY_ENGINE_API_KEY}`,
    },
  },
);
