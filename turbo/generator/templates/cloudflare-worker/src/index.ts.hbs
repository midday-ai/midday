// =============================================================================
// Types

import { requestId } from "hono/request-id";
import { registerV1ListPosts } from "./endpoints/posts/v1_list_posts";
import { registerV1ReadPost } from "./endpoints/posts/v1_read_posts";
import { registerV1UpsertPost } from "./endpoints/posts/v1_upsert_posts";
import { registerV1ReadQueue } from "./endpoints/queue/v1_read_queue";
import { registerV1WriteQueue } from "./endpoints/queue/v1_write_queue";
import { registerV1Liveness } from "./endpoints/v1_liveness";
import { createApp } from "./pkg/hono";
import { init } from "./pkg/middleware/init";
import { metrics } from "./pkg/middleware/metrics";
import { listPosts, readPost, upsertPost } from "./utils";

interface User {
  username: string;
  name: string;
  email: string;
}

interface Post {
  slug: string;
  author: User;
  body: string;
}

// =============================================================================
// Queries

// =============================================================================
// Routes

async function handleListRequest(env: Env, origin: string): Promise<Response> {
  const posts = await listPosts(env.DATABASE);
  const body = posts
    .map((post) => `${origin}${post.slug}\n${post.body}`)
    .join(`\n\n${"-".repeat(20)}\n`);
  return new Response(body);
}

async function handleReadRequest(env: Env, slug: string): Promise<Response> {
  const post = await readPost(env.DATABASE, slug);
  if (post === null) return new Response("Not Found", { status: 404 });
  else return new Response(post.body);
}

async function handlePutRequest(
  request: Request,
  env: Env,
  slug: string,
): Promise<Response> {
  if (slug === "/") return new Response("Method Not Allowed", { status: 405 });
  await upsertPost(env.DATABASE, slug, await request.text());
  return new Response(null, { status: 204 });
}

async function handleServiceDurableObjectRequest(
  request: Request,
  env: Env,
  slug: string,
): Promise<Response> {
  const { pathname } = new URL(request.url);
  const id = env.SERVICE_DURABLE_OBJECT.idFromName(pathname);

  const service = env.SERVICE_DURABLE_OBJECT.get(id);
  return service.fetch(request);
}

export async function handleKVRequest(request: Request, env: Env) {
  if (request.method === "GET") {
    const value = await env.KV_NAMESPACE.get(request.url, "stream");
    return new Response(value, { status: value === null ? 204 : 200 });
  } else if (request.method === "PUT") {
    await env.KV_NAMESPACE.put(request.url, request.body ?? "");
    return new Response(null, { status: 204 });
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
}

export async function handleR2Request(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) {
  if (request.method === "GET") {
    let response = await caches.default.match(request);
    if (response !== undefined) return response;

    const object = await env.R2_BUCKET.get(request.url);
    if (object === null) return new Response(null, { status: 204 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    response = new Response(object.body, { headers });

    ctx.waitUntil(caches.default.put(request, response.clone()));
    return response;
  } else if (request.method === "PUT") {
    await env.R2_BUCKET.put(request.url, request.body, {
      httpMetadata: request.headers,
    });
    return new Response(null, { status: 204 });
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
}

export async function processJob(env: Env, job: QueueJob) {
  const result = job.value.toUpperCase();
  await env.QUEUE_RESULTS.put(job.key, result);
}

const app = createApp();

app.use("*", init());
app.use("*", requestId());
app.use("*", metrics());

registerV1Liveness(app);
registerV1ReadQueue(app);
registerV1WriteQueue(app);
registerV1ListPosts(app);
registerV1ReadPost(app);
registerV1UpsertPost(app);

// 404 for everything else
app.all("*", () =>
  Response.json(
    {
      success: false,
      error: "Route not found",
    },
    { status: 404 },
  ),
);

// =============================================================================
// Entrypoint
const oldFetch = async (request: Request, env: Env, ctx: ExecutionContext) => {
  const { origin, pathname } = new URL(request.url);

  if (pathname === "/queue") {
    const { pathname } = new URL(request.url);
    if (request.method === "GET") {
      const value = await env.QUEUE_RESULTS.get(pathname, "stream");
      return new Response(value, { status: value === null ? 404 : 200 });
    } else if (request.method === "POST") {
      const value = await request.text();
      await env.QUEUE_PRODUCER.send({ key: pathname, value });
      return new Response("Accepted", { status: 202 });
    } else {
      return new Response("Method Not Allowed", { status: 405 });
    }
  }

  if (pathname.startsWith("/r2/")) {
    return handleR2Request(request, env, ctx);
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/kv/")) {
      return handleKVRequest(request, env);
    }

    if (pathname === "/service")
      return handleServiceDurableObjectRequest(request, env, pathname);
    else if (pathname === "/") return handleListRequest(env, origin);
    else return handleReadRequest(env, pathname);
  } else if (request.method === "PUT") {
    return handlePutRequest(request, env, pathname);
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};

export default <ExportedHandler<Env, QueueJob>>{
  fetch: app.fetch, // app.fetch,
  scheduled: async (event, env, ctx): Promise<void> => {
    // A Cron Trigger can make requests to other endpoints on the Internet,
    // publish to a Queue, query a D1 Database, and much more.
    //
    // We'll keep it simple and make an API call to a Cloudflare API:
    let resp = await fetch("https://api.cloudflare.com/client/v4/ips");
    let wasSuccessful = resp.ok ? "success" : "fail";

    // You could store this result in KV, write to a D1 Database, or publish to a Queue.
    // In this template, we'll just log the result:
    console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);
  },
  queue: async (batch, env, ctx) => {
    for (const message of batch.messages) {
      await processJob(env, message.body as QueueJob);
      message.ack();
    }
  },
};

export * from "./pkg/durable-object";
export { app };

