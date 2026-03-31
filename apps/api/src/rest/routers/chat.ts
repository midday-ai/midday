import { openai } from "@ai-sdk/openai";
import type { MentionedApp } from "@api/chat/prompt";
import { buildSystemPrompt } from "@api/chat/prompt";
import {
  buildPrepareStep,
  type ChatMCPClient,
  createExecutionClient,
  ensureToolIndex,
  getSearchTool,
  getToolDefinitions,
} from "@api/chat/tools";
import { decodeDataUrl, writeChatTitle } from "@api/chat/utils";
import { getComposioTools } from "@api/composio/client";
import type { McpContext } from "@api/mcp/types";
import type { Context } from "@api/rest/types";
import { getGeoContext } from "@api/utils/geo";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "@midday/logger";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  ToolLoopAgent,
} from "ai";
import { type RateLimitInfo, rateLimiter } from "hono-rate-limiter";

type ChatContext = {
  Variables: Context["Variables"] & {
    rateLimit: RateLimitInfo;
  };
};

const app = new OpenAPIHono<ChatContext>();

app.use(
  rateLimiter<ChatContext>({
    windowMs: 10 * 60 * 1000,
    limit: Number(process.env.CHAT_RATE_LIMIT) || 100,
    keyGenerator: (c) => c.get("session")?.user?.id ?? "unknown",
    handler: (c) =>
      c.json(
        { code: "RATE_LIMIT_EXCEEDED", error: "Chat rate limit exceeded" },
        429,
      ),
  }),
);

app.post("/", async (c) => {
  let executionClientPromise: Promise<ChatMCPClient> | null = null;

  try {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const scopes = c.get("scopes") ?? [];
    const geo = getGeoContext(c.req);
    const user = c.get("user");

    const body = await c.req.json();
    const uiMessages = body.messages as any[];

    const clientTimezone = (body.timezone as string) || null;
    const clientLocalTime = (body.localTime as string) || null;
    const resolvedTimezone =
      user?.timezone || clientTimezone || geo.timezone || "UTC";

    const mcpCtx: McpContext = {
      db,
      teamId,
      userId: user?.id ?? session.user.id,
      userEmail: user?.email ?? session.user.email ?? null,
      scopes,
      apiUrl: process.env.MIDDAY_API_URL!,
      timezone: resolvedTimezone,
      locale: user?.locale || geo.locale,
      countryCode: geo.country,
      dateFormat: user?.dateFormat ?? null,
      timeFormat: user?.timeFormat ?? null,
    };

    const mentionedApps =
      (body.mentionedApps as MentionedApp[] | undefined) ?? [];

    const systemPrompt = buildSystemPrompt({
      fullName: user?.fullName ?? null,
      locale: user?.locale || geo.locale || "en",
      timezone: resolvedTimezone,
      dateFormat: user?.dateFormat ?? null,
      timeFormat: user?.timeFormat ?? 24,
      baseCurrency: user?.team?.baseCurrency ?? "USD",
      teamName: user?.team?.name ?? null,
      countryCode: user?.team?.countryCode ?? geo.country,
      localTime: clientLocalTime,
      mentionedApps,
    });

    executionClientPromise = createExecutionClient(mcpCtx);
    const composioToolsPromise = getComposioTools(mcpCtx.userId);

    const [, modelMessages] = await Promise.all([
      ensureToolIndex(mcpCtx),
      convertToModelMessages(uiMessages),
    ]);

    const model = openai("gpt-4.1-mini");

    const rateLimitInfo = c.get("rateLimit");

    const clientPromise = executionClientPromise;

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        if (rateLimitInfo) {
          writer.write({
            type: "data-rate-limit",
            id: "rate-limit",
            data: {
              limit: rateLimitInfo.limit,
              remaining: rateLimitInfo.remaining,
            },
          });
        }

        const titlePromise = writeChatTitle(writer, uiMessages);

        const [resolvedClient, composioMetaTools] = await Promise.all([
          clientPromise,
          composioToolsPromise,
        ]).catch(async (err) => {
          await clientPromise.then((cl) => cl.close()).catch(() => {});
          throw err;
        });

        const mcpTools = resolvedClient.toolsFromDefinitions(
          getToolDefinitions(),
        );

        const composioToolNames = Object.keys(composioMetaTools);
        if (composioToolNames.length > 0) {
          logger.info("[chat] Composio tools available:", {
            tools: composioToolNames,
          });
        }

        const agent = new ToolLoopAgent({
          model,
          instructions: systemPrompt,
          tools: {
            ...mcpTools,
            ...composioMetaTools,
            search_tools: getSearchTool(),
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
            maxTools: 12,
            alwaysActive: ["web_search", "search_tools", ...composioToolNames],
          }),
          stopWhen: stepCountIs(10),
          experimental_download: async (options) =>
            options.map(({ url }) => decodeDataUrl(url)),
          onFinish: async () => {
            await titlePromise;
            await resolvedClient.close();
          },
        });

        const result = await agent.stream({
          messages: modelMessages,
          experimental_transform: smoothStream(),
        });

        writer.merge(result.toUIMessageStream({ sendSources: true }));
      },
    });

    executionClientPromise = null;

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    if (executionClientPromise) {
      await executionClientPromise.then((cl) => cl.close()).catch(() => {});
    }
    logger.error("[chat] Error:", { error: err });

    return c.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});

export const chatRouter = app;
