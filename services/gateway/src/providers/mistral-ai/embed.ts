import { MISTRAL_AI } from "../../globals";
import { EmbedParams, EmbedResponse } from "../../types/embedRequestBody";
import { ErrorResponse, ProviderConfig } from "../types";
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from "../utils";
import { MistralAIErrorResponse } from "./chatComplete";

export const MistralAIEmbedConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
    default: "mistral-embed",
  },
  input: {
    param: "input",
    required: true,
    transform: (params: EmbedParams) => {
      if (Array.isArray(params.input)) {
        return params.input;
      }

      return [params.input];
    },
  },
};

interface MistralAIEmbedResponse extends EmbedResponse {}

export const MistralAIEmbedResponseTransform: (
  response: MistralAIEmbedResponse | MistralAIErrorResponse,
  responseStatus: number,
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if ("message" in response && responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.message,
        type: response.type,
        param: response.param,
        code: response.code,
      },
      MISTRAL_AI,
    );
  }

  if ("data" in response) {
    return {
      object: response.object,
      data: response.data.map((d) => ({
        object: d.object,
        embedding: d.embedding,
        index: d.index,
      })),
      model: response.model,
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        total_tokens: response.usage.total_tokens,
      },
      provider: MISTRAL_AI,
    };
  }

  return generateInvalidProviderResponseError(response, MISTRAL_AI);
};
