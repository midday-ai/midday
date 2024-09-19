import { client } from "@absplatform/jobs";
import { createAppRoute } from "@trigger.dev/nextjs";

export const runtime = "nodejs";
export const maxDuration = 300; // 5min

import "@absplatform/jobs";

export const { POST, dynamic } = createAppRoute(client);
