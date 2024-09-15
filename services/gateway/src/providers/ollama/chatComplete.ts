import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from "../types";
import { OLLAMA } from "../../globals";
import { generateErrorResponse } from "../utils";

export const OllamaChatCompleteConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
    default: "llama2",
  },
  messages: {
    param: "messages",
    default: "",
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
  response_format: {
    param: "response_format",
  },
  seed: {
    param: "seed",
  },
  stop: {
    param: "stop",
  },
  stream: {
    param: "stream",
    default: false,
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
  max_tokens: {
    param: "max_tokens",
    default: 100,
    min: 0,
  },
};

export interface OllamaChatCompleteResponse
  extends ChatCompletionResponse,
    ErrorResponse {
  system_fingerprint: string;
}

export interface OllamaStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: {
    delta: {
      role: string;
      content?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
}

export const OllamaChatCompleteResponseTransform: (
  response: OllamaChatCompleteResponse,
  responseStatus: number,
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.error?.message,
        type: response.error?.type,
        param: null,
        code: null,
      },
      OLLAMA,
    );
  }

  return {
    id: response.id,
    object: response.object,
    created: response.created,
    model: response.model,
    provider: OLLAMA,
    choices: response.choices,
    usage: response.usage,
  };
};

export const OllamaChatCompleteStreamChunkTransform: (
  reponse: string,
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, "");
  chunk = chunk.trim();
  if (chunk === "[DONE]") {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: OllamaStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: parsedChunk.created,
      model: parsedChunk.model,
      provider: OLLAMA,
      choices: parsedChunk.choices,
    })}` + "\n\n"
  );
};
