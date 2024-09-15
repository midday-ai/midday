import { Context } from "hono";
import { CONTENT_TYPES } from "../globals";
import Providers from "../providers";
import { OpenAIChatCompleteJSONToStreamResponseTransform } from "../providers/openai/chatComplete";
import { OpenAICompleteJSONToStreamResponseTransform } from "../providers/openai/complete";
import { Options, Params } from "../types/requestBody";

import {
  handleAudioResponse,
  handleImageResponse,
  handleJSONToStreamResponse,
  handleNonStreamingMode,
  handleOctetStreamResponse,
  handleStreamingMode,
  handleTextResponse,
} from "./streamHandler";
import { HookSpan } from "../middlewares/hooks";

/**
 * Handles various types of responses based on the specified parameters
 * and returns a mapped response
 * @param {Response} response - The HTTP response received from LLM.
 * @param {boolean} streamingMode - Indicates whether streaming mode is enabled.
 * @param {string} proxyProvider - The provider string.
 * @param {string | undefined} responseTransformer - The response transformer to determine type of call.
 * @param {string} requestURL - The URL of the original LLM request.
 * @param {boolean} [isCacheHit=false] - Indicates whether the response is a cache hit.
 * @param {Params} gatewayRequest - The gateway request parameters.  (Optional)
 * @param {any} beforeRequestHooksResult - The result of the before request hooks.  (Optional)
 * @param {Context} c - The context object. (Optional)
 * @param {endpointStrings} fn - The endpoint string. (Optional)
 * @returns {Promise<{response: Response, json?: any}>} - The mapped response.
 */
export async function responseHandler(
  response: Response,
  streamingMode: boolean,
  provider: string | Options,
  responseTransformer: string | undefined,
  requestURL: string,
  isCacheHit: boolean = false,
  gatewayRequest: Params,
  strictOpenAiCompliance: boolean,
): Promise<{ response: Response; responseJson: any }> {
  let responseTransformerFunction: Function | undefined;
  let providerOption: Options | undefined;
  const responseContentType = response.headers?.get("content-type");

  if (typeof provider == "object") {
    providerOption = { ...provider };
    provider = provider.provider || "";
  }

  const providerConfig = Providers[provider];
  let providerTransformers = Providers[provider]?.responseTransforms;

  if (providerConfig?.getConfig) {
    providerTransformers =
      providerConfig.getConfig(gatewayRequest).responseTransforms;
  }

  // Checking status 200 so that errors are not considered as stream mode.
  if (responseTransformer && streamingMode && response.status === 200) {
    responseTransformerFunction =
      providerTransformers?.[`stream-${responseTransformer}`];
  } else if (responseTransformer) {
    responseTransformerFunction = providerTransformers?.[responseTransformer];
  }

  // JSON to text/event-stream conversion is only allowed for unified routes: chat completions and completions.
  // Set the transformer to OpenAI json to stream convertor function in that case.
  if (responseTransformer && streamingMode && isCacheHit) {
    responseTransformerFunction =
      responseTransformer === "chatComplete"
        ? OpenAIChatCompleteJSONToStreamResponseTransform
        : OpenAICompleteJSONToStreamResponseTransform;
  } else if (responseTransformer && !streamingMode && isCacheHit) {
    responseTransformerFunction = undefined;
  }

  if (
    streamingMode &&
    response.status === 200 &&
    isCacheHit &&
    responseTransformerFunction
  ) {
    const streamingResponse = await handleJSONToStreamResponse(
      response,
      provider,
      responseTransformerFunction,
    );
    return { response: streamingResponse, responseJson: null };
  }

  if (streamingMode && response.status === 200) {
    return {
      response: handleStreamingMode(
        response,
        provider,
        responseTransformerFunction,
        requestURL,
        strictOpenAiCompliance,
      ),
      responseJson: null,
    };
  }

  if (responseContentType?.startsWith(CONTENT_TYPES.GENERIC_AUDIO_PATTERN)) {
    return { response: handleAudioResponse(response), responseJson: null };
  }

  if (responseContentType === CONTENT_TYPES.APPLICATION_OCTET_STREAM) {
    return {
      response: handleOctetStreamResponse(response),
      responseJson: null,
    };
  }

  if (responseContentType?.startsWith(CONTENT_TYPES.GENERIC_IMAGE_PATTERN)) {
    return { response: handleImageResponse(response), responseJson: null };
  }

  if (
    responseContentType?.startsWith(CONTENT_TYPES.PLAIN_TEXT) ||
    responseContentType?.startsWith(CONTENT_TYPES.HTML)
  ) {
    const textResponse = await handleTextResponse(
      response,
      responseTransformerFunction,
    );
    return { response: textResponse, responseJson: null };
  }

  const nonStreamingResponse = await handleNonStreamingMode(
    response,
    responseTransformerFunction,
    strictOpenAiCompliance,
  );

  return {
    response: nonStreamingResponse.response,
    responseJson: nonStreamingResponse.json,
  };
}

export async function afterRequestHookHandler(
  c: Context,
  response: any,
  responseJSON: any,
  hookSpanId: string,
  retryAttemptsMade: number,
): Promise<Response> {
  try {
    const hooksManager = c.get("hooksManager");

    hooksManager.setSpanContextResponse(
      hookSpanId,
      responseJSON,
      response.status,
    );

    if (retryAttemptsMade > 0) {
      hooksManager.getSpan(hookSpanId).resetHookResult("afterRequestHook");
    }

    let { shouldDeny, results } = await hooksManager.executeHooks(hookSpanId, [
      "syncAfterRequestHook",
    ]);

    if (!responseJSON) {
      return response;
    }

    const span = hooksManager.getSpan(hookSpanId) as HookSpan;
    const hooksResult = span.getHooksResult();

    if (shouldDeny) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              "The guardrail checks defined in the config failed. You can find more information in the `hook_results` object.",
            type: "hooks_failed",
            param: null,
            code: null,
          },
          ...((hooksResult.beforeRequestHooksResult?.length ||
            hooksResult.afterRequestHooksResult?.length) && {
            hook_results: {
              before_request_hooks: hooksResult.beforeRequestHooksResult,
              after_request_hooks: hooksResult.afterRequestHooksResult,
            },
          }),
        }),
        {
          status: 446,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const failedBeforeRequestHooks =
      hooksResult.beforeRequestHooksResult.filter((h) => !h.verdict);
    const failedAfterRequestHooks = hooksResult.afterRequestHooksResult.filter(
      (h) => !h.verdict,
    );

    if (failedBeforeRequestHooks.length || failedAfterRequestHooks.length) {
      response = new Response(
        JSON.stringify({ ...responseJSON, hook_results: hooksResult }),
        {
          status: 246,
          statusText: "Hooks failed",
          headers: response.headers,
        },
      );
    }

    return new Response(
      JSON.stringify({
        ...responseJSON,
        ...((hooksResult.beforeRequestHooksResult?.length ||
          hooksResult.afterRequestHooksResult?.length) && {
          hook_results: {
            before_request_hooks: hooksResult.beforeRequestHooksResult,
            after_request_hooks: hooksResult.afterRequestHooksResult,
          },
        }),
      }),
      {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
    );
  } catch (err) {
    console.error(err);
    return response;
  }
}
