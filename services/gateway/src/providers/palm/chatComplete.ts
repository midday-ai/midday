import { PALM } from "../../globals";
import { Params } from "../../types/requestBody";
import { PalmChatCompleteResponse } from "../../types/responseBody";
import {
  GoogleErrorResponse,
  GoogleErrorResponseTransform,
} from "../google/chatComplete";
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from "../types";
import { generateInvalidProviderResponseError } from "../utils";

// TODOS: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

export const PalmChatCompleteConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
    default: "model/chat-bison-001",
  },
  messages: {
    param: "prompt",
    default: "",
    transform: (params: Params) => {
      const { examples, context, messages } = params;
      const palmMessages = messages?.map((message) => ({
        author: message.role,
        content: message.content,
      }));
      const prompt = {
        messages: palmMessages,
        examples,
        context,
      };
      return prompt;
    },
  },
  temperature: {
    param: "temperature",
    default: 1,
    min: 0,
    max: 1,
  },
  top_p: {
    param: "topP",
    default: 1,
    min: 0,
    max: 1,
  },
  top_k: {
    param: "topK",
    default: 1,
    min: 0,
    max: 1,
  },
  n: {
    param: "candidateCount",
    default: 1,
    min: 1,
    max: 8,
  },
  max_tokens: {
    param: "maxOutputTokens",
    default: 100,
    min: 1,
  },
  stop: {
    param: "stopSequences",
  },
};

export const PalmChatCompleteResponseTransform: (
  response: PalmChatCompleteResponse | GoogleErrorResponse,
  responseStatus: number,
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = GoogleErrorResponseTransform(
      response as GoogleErrorResponse,
      PALM,
    );
    if (errorResponse) return errorResponse;
  }

  if ("candidates" in response) {
    return {
      id: Date.now().toString(),
      object: "chat_completion",
      created: Math.floor(Date.now() / 1000),
      model: "Unknown",
      provider: PALM,
      choices:
        response.candidates?.map((generation, index) => ({
          message: { role: "assistant", content: generation.content },
          index: index,
          finish_reason: "length",
        })) ?? [],
    };
  }

  return generateInvalidProviderResponseError(response, PALM);
};
