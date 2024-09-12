import { cors, init, ratelimit } from "@/pkg/middleware";
import { ConsoleLogger } from "@internal/worker-logging";
import { OpenAI } from "openai";

import { zEnv, type Env } from "./pkg/env";
import { newApp } from "./pkg/hono/app";
import {
  handleNonStreamingRequest,
  handleStreamingRequest,
} from "./pkg/streaming";

const app = newApp();

app.use("*", init());
app.use("*", ratelimit());
app.use("*", cors());

app.all("*", async (c) => {
  const time = Date.now();
  const url = new URL(c.req.url);
  let subdomain = url.hostname.replace(`.${c.env.APEX_DOMAIN}`, "");
  if (
    subdomain === url.hostname ||
    (subdomain === "" && c.env.FALLBACK_SUBDOMAIN)
  ) {
    subdomain = c.env.FALLBACK_SUBDOMAIN!;
  }
  if (!subdomain) {
    return c.notFound();
  }

  const bearer = c.req.header("Authorization");
  if (!bearer) {
    return new Response("No API key", { status: 401 });
  }
  const apiKey = bearer.replace("Bearer ", "");
  const openai = new OpenAI({
    apiKey,
    baseURL: c.req.header("X-Base-Url"),
  });
  const request =
    (await c.req.json()) as OpenAI.Chat.Completions.ChatCompletionCreateParams;
  const { analytics } = c.get("services");

  // const gw = await db.query.llmGateways.findFirst({
  //   where: (table, { eq }) => eq(table.subdomain, subdomain),
  // });
  // if (!gw) {
  //   return c.text("No gateway found", { status: 404 });
  // }

  try {
    if (request.stream) {
      return await handleStreamingRequest(c, request, openai);
    }
    return await handleNonStreamingRequest(c, request, openai);
  } finally {
    c.executionCtx.waitUntil(
      (async () => {
        const p = c.get("response");
        const t = c.get("tokens");
        const tokens = t ? await t : -1;
        const response = p ? await p : "";
        await analytics.ingestLogs({
          requestId: c.get("requestId"),
          time,
          latency: {
            cache: c.get("cacheLatency") ?? -1,
            inference: c.get("inferenceLatency") ?? -1,
            service: Date.now() - time,
            vectorize: c.get("vectorizeLatency") ?? -1,
            embeddings: c.get("embeddingsLatency") ?? -1,
          },
          gatewayId: "",
          workspaceId: "",
          stream: request.stream ?? false,
          tokens: tokens,
          cache: c.get("cacheHit") ?? false,
          model: request.model,
          query: c.get("query") ?? "",
          vector: c.get("vector") ?? [],
          response,
        });
      })(),
    );
  }
});

const handler = {
  fetch: (req: Request, rawEnv: Env, executionCtx: ExecutionContext) => {
    const parsedEnv = zEnv.safeParse(rawEnv);
    if (!parsedEnv.success) {
      new ConsoleLogger({
        requestId: "",
        environment: rawEnv.ENVIRONMENT,
        application: "semantic-cache",
      }).fatal(`BAD_ENVIRONMENT: ${parsedEnv.error.message}`);
      return Response.json(
        {
          code: "BAD_ENVIRONMENT",
          message: "Some environment variables are missing or are invalid",
          errors: parsedEnv.error,
        },
        { status: 500 },
      );
    }
    return app.fetch(req, parsedEnv.data, executionCtx);
  },
} satisfies ExportedHandler<Env>;

export default handler;
