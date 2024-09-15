import { ErrorResponse, ProviderConfig } from "../types";
import { EmbedParams, EmbedResponse } from "../../types/embedRequestBody";
import { GOOGLE } from "../../globals";
import {
  GoogleErrorResponse,
  GoogleErrorResponseTransform,
} from "./chatComplete";
import { generateInvalidProviderResponseError } from "../utils";

export const GoogleEmbedConfig: ProviderConfig = {
  input: {
    param: "content",
    required: true,
    transform: (params: EmbedParams): { parts: { text: string }[] } => {
      const parts = [];
      if (Array.isArray(params.input)) {
        params.input.forEach((i) => {
          parts.push({
            text: i,
          });
        });
      } else {
        parts.push({
          text: params.input,
        });
      }

      return {
        parts,
      };
    },
  },
  model: {
    param: "model",
    required: true,
    default: "embedding-001",
  },
};

interface GoogleEmbedResponse {
  embedding: {
    values: number[];
  };
}

export const GoogleEmbedResponseTransform: (
  response: GoogleEmbedResponse | GoogleErrorResponse,
  responseStatus: number,
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = GoogleErrorResponseTransform(
      response as GoogleErrorResponse,
    );
    if (errorResposne) return errorResposne;
  }

  if ("embedding" in response) {
    return {
      object: "list",
      data: [
        {
          object: "embedding",
          embedding: response.embedding.values,
          index: 0,
        },
      ],
      model: "", // Todo: find a way to send the google embedding model name back
      usage: {
        prompt_tokens: -1,
        total_tokens: -1,
      },
    };
  }

  return generateInvalidProviderResponseError(response, GOOGLE);
};
