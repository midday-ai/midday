import { client } from "@midday/jobs";
import { createAppRoute } from "@trigger.dev/nextjs";

// export const runtime = "nodejs";
export const maxDuration = 300; // 5min

import "@midday/jobs";

export const { POST, dynamic } = createAppRoute(client);
