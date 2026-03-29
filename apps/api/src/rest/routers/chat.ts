import { openai } from "@ai-sdk/openai";
import { buildSystemPrompt } from "@api/chat/prompt";
import {
  buildPrepareStep,
  type ChatMCPClient,
  createExecutionClient,
  ensureToolIndex,
  getToolDefinitions,
} from "@api/chat/tools";
import { decodeDataUrl, writeChatTitle } from "@api/chat/utils";
import type { McpContext } from "@api/mcp/types";
import type { Context } from "@api/rest/types";
import { getGeoContext } from "@api/utils/geo";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getUserById } from "@midday/db/queries";
import { logger } from "@midday/logger";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai";

const app = new OpenAPIHono<Context>();

app.post("/", async (c) => {
  let mcpClient: ChatMCPClient | null = null;

  try {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const scopes = c.get("scopes") ?? [];
    const geo = getGeoContext(c.req);
    const user = c.get("user") ?? (await getUserById(db, session.user.id));

    const { messages: uiMessages } = await c.req.json();

    const mcpCtx: McpContext = {
      db,
      teamId,
      userId: user?.id ?? session.user.id,
      userEmail: user?.email ?? session.user.email ?? null,
      scopes,
      apiUrl: process.env.MIDDAY_API_URL!,
      timezone: user?.timezone || geo.timezone,
      locale: user?.locale || geo.locale,
      countryCode: geo.country,
      dateFormat: user?.dateFormat ?? null,
      timeFormat: user?.timeFormat ?? null,
    };

    const systemPrompt = buildSystemPrompt({
      fullName: user?.fullName ?? null,
      locale: user?.locale || geo.locale || "en",
      timezone: user?.timezone || geo.timezone || "UTC",
      dateFormat: user?.dateFormat ?? null,
      timeFormat: user?.timeFormat ?? 24,
      baseCurrency: user?.team?.baseCurrency ?? "USD",
      teamName: user?.team?.name ?? null,
      countryCode: user?.team?.countryCode ?? geo.country,
    });

    await ensureToolIndex(mcpCtx);

    const mcpClientPromise = createExecutionClient(mcpCtx);

    const [modelMessages, resolvedClient] = await Promise.all([
      convertToModelMessages(uiMessages),
      mcpClientPromise,
    ]).catch(async (err) => {
      await mcpClientPromise.then((c) => c.close()).catch(() => {});
      throw err;
    });

    mcpClient = resolvedClient;

    const mcpTools = mcpClient.toolsFromDefinitions(getToolDefinitions());
    const client = mcpClient;

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const titlePromise = writeChatTitle(writer, uiMessages);

        const result = streamText({
          model: openai("gpt-4o"),
          system: systemPrompt,
          messages: modelMessages,
          tools: {
            ...mcpTools,
            web_search: openai.tools.webSearch({
              searchContextSize: "medium",
              userLocation: {
                type: "approximate",
                country: mcpCtx.countryCode ?? undefined,
                timezone: mcpCtx.timezone ?? undefined,
              },
            }),
          },
          prepareStep: buildPrepareStep({
            maxTools: 10,
            alwaysActive: ["web_search"],
          }),
          stopWhen: stepCountIs(8),
          experimental_download: async (options) =>
            options.map(({ url }) => decodeDataUrl(url)),
          onFinish: async () => {
            await titlePromise;
            await client.close();
          },
        });

        writer.merge(result.toUIMessageStream({ sendSources: true }));
      },
    });

    mcpClient = null;

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    if (mcpClient) {
      await mcpClient.close().catch(() => {});
    }
    logger.error("[chat] Error:", { error: err });
    return c.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});

export const chatRouter = app;
