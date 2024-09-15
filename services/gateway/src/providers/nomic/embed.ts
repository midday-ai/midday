import { NOMIC } from "../../globals";
import { EmbedParams, EmbedResponse } from "../../types/embedRequestBody";
import { ErrorResponse, ProviderConfig } from "../types";
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from "../utils";

export const NomicEmbedConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
    default: "nomic-embed-text-v1",
  },
  input: {
    param: "texts",
    required: true,
    transform: (params: EmbedParams) => {
      if (Array.isArray(params.input)) {
        return params.input;
      }

      return [params.input];
    },
  },
  task_type: {
    param: "task_type",
  },
};

interface NomicEmbedResponse {
  embeddings: number[][];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface NomicValidationErrorResponse {
  detail: {
    loc: Array<any>;
    msg: string;
    type: string;
  }[];
}

export interface NomicErrorResponse {
  detail: string;
}

export const NomicErrorResponseTransform: (
  response: NomicValidationErrorResponse | NomicErrorResponse,
) => ErrorResponse = (response) => {
  let firstError: Record<string, any> | undefined;
  let errorField: string | null = null;
  let errorMessage: string | undefined;
  let errorType: string | null = null;

  if (Array.isArray(response.detail)) {
    [firstError] = response.detail;
    errorField = firstError?.loc?.join(".") ?? "";
    errorMessage = firstError.msg;
    errorType = firstError.type;
  } else {
    errorMessage = response.detail;
  }

  return generateErrorResponse(
    {
      message: `${errorField ? `${errorField}: ` : ""}${errorMessage}`,
      type: errorType,
      param: null,
      code: null,
    },
    NOMIC,
  );
};

export const NomicEmbedResponseTransform: (
  response:
    | NomicEmbedResponse
    | NomicValidationErrorResponse
    | NomicErrorResponse,
  responseStatus: number,
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (
    "detail" in response &&
    responseStatus !== 200 &&
    response.detail.length
  ) {
    return NomicErrorResponseTransform(response);
  }

  if ("embeddings" in response) {
    return {
      object: "list",
      data: response.embeddings.map((d, index) => ({
        object: "embedding",
        embedding: d,
        index: index,
      })),
      model: response.model,
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        total_tokens: response.usage.total_tokens,
      },
      provider: NOMIC,
    };
  }

  return generateInvalidProviderResponseError(response, NOMIC);
};
