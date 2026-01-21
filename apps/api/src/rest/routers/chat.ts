import type {
  ForcedToolCall,
  MetricsFilter,
} from "@api/ai/agents/config/shared";
import { buildAppContext } from "@api/ai/agents/config/shared";
import { mainAgent } from "@api/ai/agents/main";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { smoothStream } from "ai";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.post("/", withRequiredScope("chat.write"), async (c) => {
  const body = await c.req.json();
  const validationResult = chatRequestSchema.safeParse(body);

  if (!validationResult.success) {
    return c.json({ success: false, error: validationResult.error }, 400);
  }

  const {
    message,
    id,
    timezone,
    agentChoice,
    toolChoice,
    country,
    city,
    metricsFilter,
  } = validationResult.data;

  const teamId = c.get("teamId");
  const session = c.get("session");
  const userId = session.user.id;
  const db = c.get("db");

  const userContext = await getUserContext({
    db,
    userId,
    teamId,
    country,
    city,
    timezone,
  });

  // Extract forced tool params from message metadata (widget clicks)
  // When a widget sends toolParams, use them directly (bypasses AI decisions)
  let forcedToolCall: ForcedToolCall | undefined;
  const metadata = (message as any)?.metadata;
  if (metadata?.toolCall?.toolName && metadata?.toolCall?.toolParams) {
    forcedToolCall = {
      toolName: metadata.toolCall.toolName,
      toolParams: metadata.toolCall.toolParams,
    };
  }

  const appContext = buildAppContext(userContext, id, {
    metricsFilter: metricsFilter as MetricsFilter | undefined,
    forcedToolCall,
  });

  // Pass user preferences to main agent as context
  // The main agent will use this information to make better routing decisions
  return mainAgent.toUIMessageStream({
    message,
    strategy: "auto",
    maxRounds: 5,
    maxSteps: 20,
    context: appContext,
    agentChoice,
    toolChoice,
    experimental_transform: smoothStream({
      chunking: "word",
    }),
    sendSources: true,
  });
});

export { app as chatRouter };
