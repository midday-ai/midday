import { sha256 } from "@internal/hash";
import { streamSSE } from "hono/streaming";
import type { OpenAI } from "openai";

import type { CacheError } from "@internal/cache";
import { BaseError, Err, Ok, wrap, type Result } from "@internal/error";

import type { Context } from "./hono/app";
import {
  createCompletionChunk,
  OpenAIResponse,
  parseMessagesToString,
} from "./util";

class OpenAiError extends BaseError {
  retry = false;
  name = OpenAiError.name;
}

export async function handleStreamingRequest(
  c: Context,
  request: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming & {
    noCache?: boolean;
  },
  openai: OpenAI
): Promise<Response> {
  c.header("Connection", "keep-alive");
  c.header("Cache-Control", "no-cache, must-revalidate");

  const query = parseMessagesToString(request.messages);
  c.set("query", query);

  const embeddings = await createEmbeddings(c, query);
  if (embeddings.err) {
    // TODO: handle error
    throw new Error(embeddings.err.message);
  }

  const cached = await loadCache(c, embeddings.val);
  if (cached.err) {
    // TODO: handle error
    throw new Error(cached.err.message);
  }
  // Cache hit
  if (cached.val) {
    const wordsWithWhitespace = cached.val.match(/\S+\s*/g) || "";

    c.set("tokens", Promise.resolve(wordsWithWhitespace.length));
    return streamSSE(c, async (sseStream) => {
      for (const word of wordsWithWhitespace) {
        const completionChunk = await createCompletionChunk(word);
        // stringify
        const jsonString = JSON.stringify(completionChunk);
        // OpenAI have already formatted the string, so we need to unescape the newlines since Hono will do it again
        const correctedString = jsonString.replace(/\\\\n/g, "\\n");

        await sseStream.writeSSE({
          data: correctedString,
        });
      }
    });
  }

  // strip no-cache from request
  const { noCache, ...requestOptions } = request;
  const chatCompletion = await wrap(
    openai.chat.completions.create({
      ...requestOptions,
      stream_options: { include_usage: true },
    }),
    (err) => new OpenAiError({ message: err.message })
  );
  if (chatCompletion.err) {
    return c.text(chatCompletion.err.message, { status: 400 });
  }
  let response = "";
  let resolveResponse: (s: string) => void;
  let resolveTokens: (s: number) => void;
  const responseP = new Promise<string>((r) => {
    resolveResponse = r;
  });
  const tokensP = new Promise<number>((r) => {
    resolveTokens = r;
  });
  c.set("response", responseP);
  c.set("tokens", tokensP);
  let tokens = 0;
  return streamSSE(c, async (sseStream) => {
    try {
      for await (const chunk of chatCompletion.val) {
        if (chunk?.choices[0]?.delta?.content) {
          response += chunk?.choices[0]?.delta?.content;
        }
        if (chunk?.usage?.completion_tokens) {
          tokens = chunk.usage.completion_tokens;
        } else {
          await sseStream.writeSSE({
            data: JSON.stringify(chunk),
          });
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      resolveResponse(response);
      resolveTokens(tokens);
      c.executionCtx.waitUntil(
        updateCache(c, embeddings.val, response, tokens)
      );
    }
  });
}

export async function handleNonStreamingRequest(
  c: Context,
  request: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  openai: OpenAI
): Promise<Response> {
  const { logger } = c.get("services");
  const query = parseMessagesToString(request.messages);
  c.set("query", query);

  const embeddings = await createEmbeddings(c, query);
  if (embeddings.err) {
    // TODO: handle error
    throw new Error(embeddings.err.message);
  }

  const cached = await loadCache(c, embeddings.val);
  if (cached.err) {
    // TODO: handle error
    throw new Error(cached.err.message);
  }

  // Cache hit
  if (cached.val) {
    return c.json(OpenAIResponse(cached.val));
  }

  // miss

  const inferenceStart = performance.now();
  const chatCompletion = await wrap(
    openai.chat.completions.create(request),
    (err) => new OpenAiError({ message: err.message })
  );
  if (chatCompletion.err) {
    return c.text(chatCompletion.err.message, { status: 400 });
  }
  c.set("inferenceLatency", performance.now() - inferenceStart);
  const tokens = chatCompletion.val.usage?.completion_tokens ?? 0;
  c.set("tokens", Promise.resolve(tokens));

  const response = chatCompletion.val.choices.at(0)?.message.content || "";
  const { err: updateCacheError } = await updateCache(
    c,
    embeddings.val,
    response,
    tokens
  );
  if (updateCacheError) {
    logger.error("unable to update cache", {
      error: updateCacheError.message,
    });
  }

  c.set("response", Promise.resolve(response));
  return c.json(chatCompletion);
}

async function createEmbeddings(
  c: Context,
  text: string
): Promise<Result<AiTextEmbeddingsOutput, CloudflareAiError>> {
  const startEmbeddings = performance.now();
  const embeddings = await wrap(
    c.env.AI.run("@cf/baai/bge-small-en-v1.5", {
      text,
    }),
    (err) => new CloudflareAiError({ message: err.message })
  );
  c.set("embeddingsLatency", performance.now() - startEmbeddings);

  if (embeddings.err) {
    return Err(embeddings.err);
  }
  c.set("vector", embeddings.val.data[0]);
  return Ok(embeddings.val);
}

export class CloudflareAiError extends BaseError {
  public readonly retry = true;
  public readonly name = CloudflareAiError.name;
}

export class CloudflareVectorizeError extends BaseError {
  public readonly retry = true;
  public readonly name = CloudflareVectorizeError.name;
}

async function loadCache(
  c: Context,
  embeddings: AiTextEmbeddingsOutput
): Promise<
  Result<
    string | undefined,
    CloudflareAiError | CloudflareVectorizeError | CacheError
  >
> {
  const vector = embeddings.data[0];
  c.set("vector", vector);
  const startVectorize = performance.now();
  const query = await wrap(
    c.env.VECTORIZE_INDEX.query(vector as number[], {
      topK: 1,
      returnMetadata: true,
    }),
    (err) => new CloudflareVectorizeError({ message: err.message })
  );
  c.set("vectorizeLatency", performance.now() - startVectorize);
  if (query.err) {
    return Err(query.err);
  }

  const thresholdHeader = c.req.header("X-Min-Similarity");
  const threshold = thresholdHeader ? Number.parseFloat(thresholdHeader) : 0.9;

  if (query.val.count === 0 || (query.val.matches[0]?.score ?? 0) < threshold) {
    c.set("cacheHit", false);
    c.res.headers.set("Unkey-Cache", "MISS");

    return Ok(undefined);
  }

  const response = query.val.matches[0]!.metadata?.response as
    | string
    | undefined;
  c.set("response", Promise.resolve(response as string));
  c.set(
    "tokens",
    Promise.resolve(query.val.matches[0]!.metadata?.tokens as number)
  );

  c.set("cacheHit", true);
  c.res.headers.set("Unkey-Cache", "HIT");

  return Ok(response);
}

async function updateCache(
  c: Context,
  embeddings: AiTextEmbeddingsOutput,
  response: string,
  tokens: number
): Promise<Result<void, CloudflareVectorizeError>> {
  const id = await sha256(response);
  const vector = embeddings.data[0];

  const vectorizeRes = await wrap(
    c.env.VECTORIZE_INDEX.insert([
      { id, values: vector as number[], metadata: { response, tokens } },
    ]),
    (err) => new CloudflareVectorizeError({ message: err.message })
  );
  if (vectorizeRes.err) {
    return Err(vectorizeRes.err);
  }

  return Ok();
}
