import { PREDIBASE } from "../../globals";
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from "../types";
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
  splitString,
} from "../utils";

export const PredibaseChatCompleteConfig: ProviderConfig = {
  model: {
    param: "model",
    required: false,
    default: "",
    /*
    The Predibase model format is "<base_model>[:adapter_id]",
    where adapter_id format is "<adapter_repository_reference/version_number"
    (version_number is required).
    */
    transform: (value: PredibaseChatCompleteResponse) => {
      return splitString(value.model, ":").after;
    },
  },
  messages: {
    param: "messages",
    required: true,
    default: [],
  },
  max_tokens: {
    param: "max_tokens",
    required: false,
    default: 4096,
    min: 0,
  },
  temperature: {
    param: "temperature",
    required: false,
    default: 0.1,
    min: 0,
    max: 1,
  },
  top_p: {
    param: "top_p",
    required: false,
    default: 1,
    min: 0,
    max: 1,
  },
  response_format: {
    param: "response_format",
    required: false,
  },
  stream: {
    param: "stream",
    required: false,
    default: false,
  },
  n: {
    param: "n",
    required: false,
    default: 1,
    max: 1,
    min: 1,
  },
  stop: {
    param: "stop",
    required: false,
  },
  top_k: {
    param: "top_k",
    required: false,
    default: -1,
  },
  best_of: {
    param: "best_of",
    required: false,
  },
};

interface PredibaseChatCompleteResponse extends ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PredibaseErrorResponse extends ErrorResponse {}

export const PredibaseChatCompleteResponseTransform: (
  response: PredibaseChatCompleteResponse | PredibaseErrorResponse,
  responseStatus: number,
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if ("error" in response && responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.error.message,
        type: response.error.type,
        param: null,
        code: response.error.code?.toString() || null,
      },
      PREDIBASE,
    );
  }

  if ("choices" in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: PREDIBASE,
      choices: response.choices.map((c) => ({
        index: c.index,
        message: c.message,
        logprobs: c.logprobs,
        finish_reason: c.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
    };
  }

  return generateInvalidProviderResponseError(response, PREDIBASE);
};

interface PredibaseChatChoice {
  message: {
    role: string;
    content: string;
  };
  delta: {
    role: string;
    content: string;
  };
  index: number;
  finish_reason: string | null;
}

export interface PredibaseChatCompletionStreamChunk {
  id: string;
  model: string;
  object: string;
  created: number;
  error: string;
  error_type: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: PredibaseChatChoice[];
}

export const PredibaseChatCompleteStreamChunkTransform: (
  response: string,
) => string | ErrorResponse = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data:\s*/, "");
  chunk = chunk.trim();
  if (chunk === "[DONE]") {
    return `data: ${chunk}\n\n`;
  }

  const parsedChunk: PredibaseChatCompletionStreamChunk = JSON.parse(chunk);

  if ("error" in parsedChunk) {
    return (
      `data: ${JSON.stringify({
        id: null,
        object: null,
        created: null,
        model: null,
        provider: PREDIBASE,
        choices: [
          {
            index: 0,
            delta: { role: parsedChunk.error_type, content: parsedChunk.error },
            finish_reason: "error",
          },
        ],
      })}` + "\n\n"
    );
  }
  return (
    `data: ${JSON.stringify({
      id: parsedChunk["id"],
      object: parsedChunk["object"],
      created: parsedChunk["created"],
      model: parsedChunk["model"],
      provider: PREDIBASE,
      choices: [
        {
          index: parsedChunk["choices"][0]["index"],
          delta: parsedChunk["choices"][0]["delta"],
          finish_reason: parsedChunk["choices"][0]["finish_reason"],
        },
      ],
      ...(parsedChunk["usage"] ? { usage: parsedChunk["usage"] } : {}),
    })}` + "\n\n"
  );
};
