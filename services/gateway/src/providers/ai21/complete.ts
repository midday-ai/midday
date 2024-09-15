import { AI21 } from "../../globals";
import { Params } from "../../types/requestBody";
import { CompletionResponse, ErrorResponse, ProviderConfig } from "../types";
import { generateInvalidProviderResponseError } from "../utils";
import { AI21ErrorResponseTransform } from "./chatComplete";

export const AI21CompleteConfig: ProviderConfig = {
  prompt: {
    param: "prompt",
    required: true,
  },
  n: {
    param: "numResults",
    default: 1,
  },
  max_tokens: {
    param: "maxTokens",
    default: 16,
  },
  minTokens: {
    param: "minTokens",
    default: 0,
  },
  temperature: {
    param: "temperature",
    default: 0.7,
    min: 0,
    max: 1,
  },
  top_p: {
    param: "topP",
    default: 1,
  },
  top_k: {
    param: "topKReturn",
    default: 0,
  },
  stop: {
    param: "stopSequences",
  },
  presence_penalty: {
    param: "presencePenalty",
    transform: (params: Params) => {
      return {
        scale: params.presence_penalty,
      };
    },
  },
  frequency_penalty: {
    param: "frequencyPenalty",
    transform: (params: Params) => {
      return {
        scale: params.frequency_penalty,
      };
    },
  },
  countPenalty: {
    param: "countPenalty",
  },
  frequencyPenalty: {
    param: "frequencyPenalty",
  },
  presencePenalty: {
    param: "presencePenalty",
  },
};

interface AI21CompleteResponse {
  id: string;
  prompt: {
    text: string;
    tokens: Record<string, any>[];
  };
  completions: [
    {
      data: {
        text: string;
        tokens: Record<string, any>[];
      };
      finishReason: {
        reason: string;
        length: number;
      };
    },
  ];
}

export interface AI21ErrorResponse {
  detail: string;
}

export const AI21CompleteResponseTransform: (
  response: AI21CompleteResponse | AI21ErrorResponse,
  responseStatus: number,
) => CompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = AI21ErrorResponseTransform(
      response as AI21ErrorResponse,
    );
    if (errorResposne) return errorResposne;
  }

  if ("completions" in response) {
    const inputTokens = response.prompt.tokens?.length || 0;
    const outputTokens = response.completions
      .map((c) => c.data?.tokens?.length || 0)
      .reduce((partialSum, a) => partialSum + a, 0);

    return {
      id: response.id,
      object: "text_completion",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: AI21,
      choices: response.completions.map((completion, index) => ({
        text: completion.data.text,
        index: index,
        logprobs: null,
        finish_reason: completion.finishReason?.reason,
      })),
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, AI21);
};
