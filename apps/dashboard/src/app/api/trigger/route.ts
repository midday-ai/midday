import { client } from "@/trigger";
import { createAppRoute } from "@trigger.dev/nextjs";

export const runtime = "nodejs";
export const maxDuration = 60;

import "@/jobs/transactions";

export const { POST, dynamic } = createAppRoute(client);
