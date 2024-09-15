import { NOVITA_AI } from "../../globals";
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from "../types";
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from "../utils";

// TODOS: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

export const NovitaAIChatCompleteConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
    default: "lzlv_70b",
  },
  messages: {
    param: "messages",
    required: true,
    default: "",
  },
  max_tokens: {
    param: "max_tokens",
    required: true,
    default: 128,
    min: 1,
  },
  stop: {
    param: "stop",
  },
  temperature: {
    param: "temperature",
  },
  top_p: {
    param: "top_p",
  },
  n: {
    param: "n",
  },
  top_k: {
    param: "top_k",
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
  stream: {
    param: "stream",
    default: false,
  },
  logprobs: {
    param: "logprobs",
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
};

export interface NovitaAIChatCompleteResponse extends ChatCompletionResponse {
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NovitaAIErrorResponse {
  model: string;
  job_id: string;
  request_id: string;
  error: string;
  message?: string;
  type?: string;
}

export interface NovitaAIOpenAICompatibleErrorResponse extends ErrorResponse {}

export interface NovitaAIChatCompletionStreamChunk {
  id: string;
  request_id: string;
  object: string;
  choices: {
    index: number;
    delta: {
      content: string;
    };
  }[];
}

export const NovitaAIErrorResponseTransform: (
  response: NovitaAIErrorResponse | NovitaAIOpenAICompatibleErrorResponse,
) => ErrorResponse | false = (response) => {
  if ("error" in response && typeof response.error === "string") {
    return generateErrorResponse(
      { message: response.error, type: null, param: null, code: null },
      NOVITA_AI,
    );
  }

  if ("error" in response && typeof response.error === "object") {
    return generateErrorResponse(
      {
        message: response.error?.message || "",
        type: response.error?.type || null,
        param: response.error?.param || null,
        code: response.error?.code || null,
      },
      NOVITA_AI,
    );
  }

  if ("message" in response && response.message) {
    return generateErrorResponse(
      {
        message: response.message,
        type: response.type || null,
        param: null,
        code: null,
      },
      NOVITA_AI,
    );
  }

  return false;
};

export const NovitaAIChatCompleteResponseTransform: (
  response:
    | NovitaAIChatCompleteResponse
    | NovitaAIErrorResponse
    | NovitaAIOpenAICompatibleErrorResponse,
  responseStatus: number,
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = NovitaAIErrorResponseTransform(
      response as NovitaAIErrorResponse,
    );
    if (errorResponse) return errorResponse;
  }

  if ("choices" in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: NOVITA_AI,
      choices: response.choices.map((choice) => {
        return {
          message: {
            role: "assistant",
            content: choice.message.content,
            tool_calls: choice.message.tool_calls
              ? choice.message.tool_calls.map((toolCall: any) => ({
                  id: toolCall.id,
                  type: toolCall.type,
                  function: toolCall.function,
                }))
              : null,
          },
          index: 0,
          logprobs: null,
          finish_reason: choice.finish_reason,
        };
      }),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, NOVITA_AI);
};

export const NovitaAIChatCompleteStreamChunkTransform: (
  response: string,
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, "");
  chunk = chunk.trim();
  if (chunk === "[DONE]") {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: NovitaAIChatCompletionStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: NOVITA_AI,
      choices: [
        {
          delta: {
            content: parsedChunk.choices[0]?.delta.content,
          },
          index: parsedChunk.choices[0]?.index || 0,
          finish_reason: "",
        },
      ],
    })}` + "\n\n"
  );
};
