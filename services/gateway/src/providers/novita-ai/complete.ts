import { NOVITA_AI } from "../../globals";
import { CompletionResponse, ErrorResponse, ProviderConfig } from "../types";
import { generateInvalidProviderResponseError } from "../utils";
import {
  NovitaAIErrorResponse,
  NovitaAIErrorResponseTransform,
  NovitaAIOpenAICompatibleErrorResponse,
} from "./chatComplete";

export const NovitaAICompleteConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
    default: "lzlv_70b",
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

interface NovitaAICompleteResponse extends CompletionResponse {
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface NovitaAICompletionStreamChunk {
  id: string;
  request_id: string;
  choices: {
    text: string;
  }[];
}

export const NovitaAICompleteResponseTransform: (
  response:
    | NovitaAICompleteResponse
    | NovitaAIErrorResponse
    | NovitaAIOpenAICompatibleErrorResponse,
  responseStatus: number,
) => CompletionResponse | ErrorResponse = (response, responseStatus) => {
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

  return generateInvalidProviderResponseError(response, NOVITA_AI);
};

export const NovitaAICompleteStreamChunkTransform: (
  response: string,
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, "");
  chunk = chunk.trim();
  if (chunk === "[DONE]") {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: NovitaAICompletionStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: "text_completion",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: NOVITA_AI,
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
