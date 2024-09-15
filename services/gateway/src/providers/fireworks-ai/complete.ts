import { FIREWORKS_AI } from "../../globals";
import { CompletionResponse, ErrorResponse, ProviderConfig } from "../types";
import { generateInvalidProviderResponseError } from "../utils";
import {
  FireworksAIErrorResponse,
  FireworksAIErrorResponseTransform,
  FireworksAIStreamChunk,
  FireworksAIValidationErrorResponse,
} from "./chatComplete";

export const FireworksAICompleteConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
  },
  prompt: {
    param: "prompt",
    required: true,
  },
  max_tokens: {
    param: "max_tokens",
    default: 16,
    min: 0,
  },
  logprobs: {
    param: "logprobs",
    min: 0,
    max: 5,
  },
  echo: {
    param: "echo",
  },
  temperature: {
    param: "temperature",
    default: 1,
    min: 0,
    max: 2,
  },
  top_p: {
    param: "top_p",
    default: 1,
    min: 0,
    max: 1,
  },
  top_k: {
    param: "top_k",
    min: 1,
    max: 128,
  },
  frequency_penalty: {
    param: "frequency_penalty",
    min: -2,
    max: 2,
  },
  presence_penalty: {
    param: "presence_penalty",
    min: -2,
    max: 2,
  },
  n: {
    param: "n",
    default: 1,
    min: 1,
    max: 128,
  },
  stop: {
    param: "stop",
  },
  response_format: {
    param: "response_format",
  },
  stream: {
    param: "stream",
    default: false,
  },
  context_length_exceeded_behavior: {
    param: "context_length_exceeded_behavior",
  },
  user: {
    param: "user",
  },
};

interface FireworksAICompleteResponse extends CompletionResponse {
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

export const FireworksAICompleteResponseTransform: (
  response:
    | FireworksAICompleteResponse
    | FireworksAIValidationErrorResponse
    | FireworksAIErrorResponse,
  responseStatus: number,
) => CompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    return FireworksAIErrorResponseTransform(
      response as FireworksAIValidationErrorResponse | FireworksAIErrorResponse,
    );
  }

  if ("choices" in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: FIREWORKS_AI,
      choices: response.choices.map((c) => ({
        index: c.index,
        logprobs: c.logprobs,
        text: c.text,
        finish_reason: c.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      },
    };
  }
  return generateInvalidProviderResponseError(response, FIREWORKS_AI);
};

export interface FireworksAICompleteStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    text: string;
    index: number;
    finish_reason: string | null;
    logprobs: null;
  }[];
  usage: null | {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const FireworksAICompleteStreamChunkTransform: (
  response: string,
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, "");
  chunk = chunk.trim();
  if (chunk === "[DONE]") {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: FireworksAICompleteStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: parsedChunk.created,
      model: parsedChunk.model,
      provider: FIREWORKS_AI,
      choices: [
        {
          index: parsedChunk.choices[0].index ?? 0,
          text: parsedChunk.choices[0].text,
          logprobs: null,
          finish_reason: parsedChunk.choices[0].finish_reason,
        },
      ],
      ...(parsedChunk.usage ? { usage: parsedChunk.usage } : {}),
    })}` + "\n\n"
  );
};
