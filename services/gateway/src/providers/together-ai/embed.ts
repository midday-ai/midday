import { TOGETHER_AI } from '../../globals';
import { EmbedParams, EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import { generateInvalidProviderResponseError } from '../utils';
import {
  TogetherAIErrorResponse,
  TogetherAIErrorResponseTransform,
} from './chatComplete';

export const TogetherAIEmbedConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'mistral-embed',
  },
  input: {
    param: 'input',
    required: true,
    transform: (params: EmbedParams) => {
      if (Array.isArray(params.input)) {
        return params.input;
      }

      return [params.input];
    },
  },
};

interface TogetherAIEmbedResponse extends EmbedResponse {}

export const TogetherAIEmbedResponseTransform: (
  response: TogetherAIEmbedResponse | TogetherAIErrorResponse,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = TogetherAIErrorResponseTransform(
      response as TogetherAIErrorResponse
    );
    if (errorResponse) return errorResponse;
  }

  if ('data' in response) {
    return {
      object: response.object,
      data: response.data.map((d) => ({
        object: d.object,
        embedding: d.embedding,
        index: d.index,
      })),
      model: response.model,
      usage: {
        prompt_tokens: 0,
        total_tokens: 0,
      },
      provider: TOGETHER_AI,
    };
  }

  return generateInvalidProviderResponseError(response, TOGETHER_AI);
};
