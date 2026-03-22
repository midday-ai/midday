import { openai } from "@ai-sdk/openai";
import { buildSystemPrompt } from "@api/ai/system-prompt";
import { toolIndex } from "@api/ai/tool-index";
import { allTools } from "@api/ai/tools";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { pipeJsonRender } from "@json-render/core";
import type { UIMessage } from "ai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.post("/", withRequiredScope("chat.write"), async (c) => {
  const body = await c.req.json();
  const validationResult = chatRequestSchema.safeParse(body);

  if (!validationResult.success) {
    return c.json({ success: false, error: validationResult.error }, 400);
  }

  const {
    messages: uiMessages,
    id,
    timezone,
    country,
    city,
    invoiceId,
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

  const systemPrompt = buildSystemPrompt({
    companyName: userContext.teamName ?? "",
    baseCurrency: userContext.baseCurrency ?? "USD",
    locale: userContext.locale ?? "en-US",
    currentDateTime: new Date().toISOString(),
    timezone:
      userContext.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const appContext = {
    userId: `${userId}:${teamId}`,
    fullName: userContext.fullName ?? "",
    companyName: userContext.teamName ?? "",
    baseCurrency: userContext.baseCurrency ?? "USD",
    locale: userContext.locale ?? "en-US",
    currentDateTime: new Date().toISOString(),
    timezone:
      userContext.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    chatId: id,
    teamId,
    country: userContext.country ?? undefined,
    city: userContext.city ?? undefined,
    fiscalYearStartMonth: userContext.fiscalYearStartMonth ?? undefined,
    hasBankAccounts: userContext.hasBankAccounts ?? false,
    invoiceId: invoiceId ?? undefined,
  };

  const modelMessages = await convertToModelMessages(uiMessages as UIMessage[]);

  const result = streamText({
    model: openai("gpt-4o"),
    tools: allTools,
    prepareStep: toolIndex.prepareStep(),
    system: systemPrompt,
    messages: modelMessages,
    stopWhen: stepCountIs(10),
    experimental_transform: smoothStream({ chunking: "word" }),
    experimental_context: appContext,
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(pipeJsonRender(result.toUIMessageStream()));
    },
  });

  return createUIMessageStreamResponse({ stream });
});

export { app as chatRouter };
