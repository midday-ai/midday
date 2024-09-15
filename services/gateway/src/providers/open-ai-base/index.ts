import { OPEN_AI } from "../../globals";
import { EmbedResponse } from "../../types/embedRequestBody";
import { OpenAIChatCompleteResponse } from "../openai/chatComplete";
import { OpenAICompleteResponse } from "../openai/complete";
import { OpenAIErrorResponseTransform } from "../openai/utils";
import { ErrorResponse, ProviderConfig } from "../types";

type CustomTransformer<T extends any, U> = (
  response: T | ErrorResponse,
  isError?: boolean,
) => U;

const excludeObjectKeys = (keyList: string[], object: Record<string, any>) => {
  if (keyList) {
    keyList.forEach((excludeKey) => {
      if (Object.hasOwn(object, excludeKey)) {
        delete object[excludeKey];
      }
    });
  }
};

/**
 *
 * @param exclude List of string that we should exclude from open-ai default paramters
 * @param defaultValues Default values specific to the provider for params
 * @param extra Extra parameters type of ProviderConfig should extend to support the provider
 * @returns {ProviderConfig}
 */
export const chatCompleteParams = (
  exclude: string[],
  defaultValues?: Record<string, string>,
  extra?: ProviderConfig,
): ProviderConfig => {
  const baseParams: ProviderConfig = {
    model: {
      param: "model",
      required: true,
      ...(defaultValues?.model && { default: defaultValues.model }),
    },
    messages: {
      param: "messages",
      default: "",
    },
    functions: {
      param: "functions",
    },
    function_call: {
      param: "function_call",
    },
    max_tokens: {
      param: "max_tokens",
      ...(defaultValues?.max_tokens && { default: defaultValues.max_tokens }),
      min: 0,
    },
    temperature: {
      param: "temperature",
      ...(defaultValues?.temperature && { default: defaultValues.temperature }),
      min: 0,
      max: 2,
    },
    top_p: {
      param: "top_p",
      ...(defaultValues?.top_p && { default: defaultValues.top_p }),
      min: 0,
      max: 1,
    },
    n: {
      param: "n",
      default: 1,
    },
    stream: {
      param: "stream",
      ...(defaultValues?.stream && { default: defaultValues.stream }),
    },
    presence_penalty: {
      param: "presence_penalty",
      min: -2,
      max: 2,
    },
    frequency_penalty: {
      param: "frequency_penalty",
      min: -2,
      max: 2,
    },
    logit_bias: {
      param: "logit_bias",
    },
    user: {
      param: "user",
    },
    seed: {
      param: "seed",
    },
    tools: {
      param: "tools",
    },
    tool_choice: {
      param: "tool_choice",
    },
    response_format: {
      param: "response_format",
    },
    logprobs: {
      param: "logprobs",
      ...(defaultValues?.logprobs && { default: defaultValues?.logprobs }),
    },
    stream_options: {
      param: "stream_options",
    },
  };

  // Exclude params that are not needed.
  excludeObjectKeys(exclude, baseParams);

  return { ...baseParams, ...(extra ?? {}) };
};

/**
 *
 * @param exclude List of string that we should exclude from open-ai default paramters
 * @param defaultValues Default values specific to the provider for params
 * @param extra Extra parameters type of ProviderConfig should extend to support the provider
 * @returns {ProviderConfig}
 */
export const completeParams = (
  exclude: string[],
  defaultValues?: Record<string, string>,
  extra?: ProviderConfig,
): ProviderConfig => {
  const baseParams: ProviderConfig = {
    model: {
      param: "model",
      required: true,
      ...(defaultValues?.model && { default: defaultValues.model }),
    },
    prompt: {
      param: "prompt",
      default: "",
    },
    max_tokens: {
      param: "max_tokens",
      ...(defaultValues?.max_tokens && { default: defaultValues.max_tokens }),
      min: 0,
    },
    temperature: {
      param: "temperature",
      ...(defaultValues?.temperature && { default: defaultValues.temperature }),
      min: 0,
      max: 2,
    },
    top_p: {
      param: "top_p",
      ...(defaultValues?.top_p && { default: defaultValues.top_p }),
      min: 0,
      max: 1,
    },
    n: {
      param: "n",
      default: 1,
    },
    stream: {
      param: "stream",
      ...(defaultValues?.stream && { default: defaultValues.stream }),
    },
    logprobs: {
      param: "logprobs",
      max: 5,
    },
    echo: {
      param: "echo",
      default: false,
    },
    stop: {
      param: "stop",
    },
    presence_penalty: {
      param: "presence_penalty",
      min: -2,
      max: 2,
    },
    frequency_penalty: {
      param: "frequency_penalty",
      min: -2,
      max: 2,
    },
    best_of: {
      param: "best_of",
    },
    logit_bias: {
      param: "logit_bias",
    },
    user: {
      param: "user",
    },
    seed: {
      param: "seed",
    },
    suffix: {
      param: "suffix",
    },
  };

  excludeObjectKeys(exclude, baseParams);

  return { ...baseParams, ...(extra ?? {}) };
};

export const embedParams = (
  exclude: string[],
  defaultValues?: Record<string, string>,
  extra?: ProviderConfig,
): ProviderConfig => {
  const baseParams: ProviderConfig = {
    model: {
      param: "model",
      required: true,
      ...(defaultValues?.model && { default: defaultValues.model }),
    },
    input: {
      param: "input",
      required: true,
    },
    encoding_format: {
      param: "encoding_format",
    },
    dimensions: {
      param: "dimensions",
    },
    user: {
      param: "user",
    },
  };

  excludeObjectKeys(exclude, baseParams);

  return { ...baseParams, ...(extra ?? {}) };
};

const EmbedResponseTransformer = <T extends EmbedResponse | ErrorResponse>(
  provider: string,
  customTransformer?: CustomTransformer<EmbedResponse, T>,
) => {
  const transformer: (
    response: T | ErrorResponse,
    responseStatus: number,
  ) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
    if (responseStatus !== 200 && "error" in response) {
      return OpenAIErrorResponseTransform(response, provider ?? OPEN_AI);
    }

    Object.defineProperty(response, "provider", {
      value: provider,
      enumerable: true,
    });
    return response;
  };

  return transformer;
};

const CompleteResponseTransformer = <
  T extends OpenAICompleteResponse | ErrorResponse,
>(
  provider: string,
  customTransformer?: CustomTransformer<OpenAICompleteResponse, T>,
) => {
  const transformer: (
    response: T | ErrorResponse,
    responseStatus: number,
  ) => T | ErrorResponse = (response, responseStatus) => {
    if (responseStatus !== 200 && "error" in response) {
      const errorResponse = OpenAIErrorResponseTransform(
        response,
        provider ?? OPEN_AI,
      );
      if (customTransformer) {
        return customTransformer(errorResponse, true);
      }
    }

    if (customTransformer) {
      return customTransformer(response as T);
    }

    Object.defineProperty(response, "provider", {
      value: provider,
      enumerable: true,
    });

    return response;
  };

  return transformer;
};

const ChatCompleteResponseTransformer = <
  T extends OpenAIChatCompleteResponse | ErrorResponse,
>(
  provider: string,
  customTransformer?: CustomTransformer<OpenAIChatCompleteResponse, T>,
) => {
  const transformer: (
    response: T | ErrorResponse,
    responseStatus: number,
  ) => T | ErrorResponse = (response, responseStatus) => {
    if (responseStatus !== 200 && "error" in response) {
      const errorResponse = OpenAIErrorResponseTransform(
        response,
        provider ?? OPEN_AI,
      );
      if (customTransformer) {
        return customTransformer(response as ErrorResponse, true);
      }

      return errorResponse;
    }

    if (customTransformer) {
      return customTransformer(response as T);
    }

    Object.defineProperty(response, "provider", {
      value: provider,
      enumerable: true,
    });
    return response;
  };

  return transformer;
};

/**
 *
 * @param provider Provider value
 * @param options Enable transformer functions to specific task (complete, chatComplete or embed)
 * @returns
 */
export const responseTransformers = <
  T extends EmbedResponse | ErrorResponse,
  U extends OpenAICompleteResponse | ErrorResponse,
  V extends OpenAIChatCompleteResponse | ErrorResponse,
>(
  provider: string,
  options: {
    embed?: boolean | CustomTransformer<EmbedResponse | ErrorResponse, T>;
    complete?:
      | boolean
      | CustomTransformer<OpenAICompleteResponse | ErrorResponse, U>;
    chatComplete?:
      | boolean
      | CustomTransformer<OpenAIChatCompleteResponse | ErrorResponse, V>;
  },
) => {
  const transformers: Record<string, Function | null> = {
    complete: null,
    chatComplete: null,
    embed: null,
  };

  if (options.embed) {
    transformers.embed = EmbedResponseTransformer<T>(
      provider,
      typeof options.embed === "function" ? options.embed : undefined,
    );
  }

  if (options.complete) {
    transformers.complete = CompleteResponseTransformer<U>(
      provider,
      typeof options.complete === "function" ? options.complete : undefined,
    );
  }

  if (options.chatComplete) {
    transformers.chatComplete = ChatCompleteResponseTransformer<V>(
      provider,
      typeof options.chatComplete === "function"
        ? options.chatComplete
        : undefined,
    );
  }

  return transformers;
};
