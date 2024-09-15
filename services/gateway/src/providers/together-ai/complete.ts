import { TOGETHER_AI } from "../../globals";
import { CompletionResponse, ErrorResponse, ProviderConfig } from "../types";
import { generateInvalidProviderResponseError } from "../utils";
import {
  TogetherAIErrorResponse,
  TogetherAIErrorResponseTransform,
  TogetherAIOpenAICompatibleErrorResponse,
} from "./chatComplete";

export const TogetherAICompleteConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
    default: "togethercomputer/RedPajama-INCITE-7B-Instruct",
  },
  prompt: {
    param: "prompt",
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
  top_k: {
    param: "top_k",
  },
  frequency_penalty: {
    param: "repetition_penalty",
  },
  stream: {
    param: "stream",
    default: false,
  },
  logprobs: {
    param: "logprobs",
  },
};

interface TogetherAICompleteResponse extends CompletionResponse {
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface TogetherAICompletionStreamChunk {
  id: string;
  request_id: string;
  choices: {
    text: string;
  }[];
}

export const TogetherAICompleteResponseTransform: (
  response:
    | TogetherAICompleteResponse
    | TogetherAIErrorResponse
    | TogetherAIOpenAICompatibleErrorResponse,
  responseStatus: number,
) => CompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = TogetherAIErrorResponseTransform(
      response as TogetherAIErrorResponse,
    );
    if (errorResponse) return errorResponse;
  }

  if ("choices" in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: TOGETHER_AI,
      choices: response.choices.map((choice) => ({
        text: choice.text,
        index: choice.index || 0,
        logprobs: null,
        finish_reason: choice.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, TOGETHER_AI);
};

export const TogetherAICompleteStreamChunkTransform: (
  response: string,
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, "");
  chunk = chunk.trim();
  if (chunk === "[DONE]") {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: TogetherAICompletionStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: "text_completion",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: TOGETHER_AI,
      choices: [
        {
          text: parsedChunk.choices[0]?.text,
          index: 0,
          finish_reason: "",
        },
      ],
    })}` + "\n\n"
  );
};
