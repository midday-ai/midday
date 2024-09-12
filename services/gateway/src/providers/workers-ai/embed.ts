import { WORKERS_AI } from '../../globals';
import { EmbedParams, EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const WorkersAiEmbedConfig: ProviderConfig = {
  input: {
    param: 'text',
    required: true,
    transform: (params: EmbedParams): string[] => {
      if (Array.isArray(params.input)) {
        return params.input;
      } else {
        return [params.input];
      }
    },
  },
};

export interface WorkersAiErrorObject {
  code: string;
  message: string;
}

interface WorkersAiErrorResponse {
  success: boolean;
  errors: WorkersAiErrorObject[];
}

export const WorkersAiErrorResponseTransform: (
  response: WorkersAiErrorResponse
) => ErrorResponse | undefined = (response) => {
  if ('errors' in response) {
    return generateErrorResponse(
      {
        message: response.errors
          ?.map((error) => `Error ${error.code}:${error.message}`)
          .join(', '),
        type: null,
        param: null,
        code: null,
      },
      WORKERS_AI
    );
  }

  return undefined;
};

/**
 * The structure of the CohereEmbedResponse.
 * @interface
 */
export interface WorkersAiEmbedResponse {
  result: {
    /** An array of strings which were the input texts to be embedded. */
    shape: number[];

    /** A 2D array of floating point numbers representing the embeddings. */
    data: number[][];
  };
}

export const WorkersAiEmbedResponseTransform: (
  response: WorkersAiEmbedResponse | WorkersAiErrorResponse,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = WorkersAiErrorResponseTransform(
      response as WorkersAiErrorResponse
    );
    if (errorResponse) return errorResponse;
  }

  if ('result' in response) {
    return {
      object: 'list',
      data: response.result.data.map((embedding, index) => ({
        object: 'embedding',
        embedding: embedding,
        index: index,
      })),
      model: '', // TODO: find a way to send the cohere embedding model name back
      usage: {
        prompt_tokens: -1,
        total_tokens: -1,
      },
    };
  }

  return generateInvalidProviderResponseError(response, WORKERS_AI);
};
