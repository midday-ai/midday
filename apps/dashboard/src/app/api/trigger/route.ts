import { client } from "@midday/jobs";
import { createAppRoute } from "@trigger.dev/nextjs";

export const runtime = "nodejs";

export const { POST, dynamic } = createAppRoute(client);
