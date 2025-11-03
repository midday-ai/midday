import { buildAppContext } from "@api/ai/agents/config/shared";
import { mainAgent } from "@api/ai/agents/main";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { smoothStream } from "ai";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.post("/", withRequiredScope("chat.write"), async (c) => {
  // Parse and validate the request body manually
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
    region,
  } = validationResult.data;

  const teamId = c.get("teamId");
  const session = c.get("session");
  const userId = session.user.id;

  const appContext = buildAppContext({
    userId,
    fullName: "John Doe",
    companyName: "Acme Inc.",
    baseCurrency: "SEK",
    locale: "sv-SE",
    timezone: timezone || "Europe/Stockholm",
    country: country || "SE",
    city: city || "Stockholm",
    region: region || "Stockholm",
    chatId: id,
    teamId,
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
