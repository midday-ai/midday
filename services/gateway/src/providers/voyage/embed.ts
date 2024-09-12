import { VOYAGE } from '../../globals';
import { EmbedParams, EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const VoyageEmbedConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
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
  input_type: {
    param: 'input_type',
    required: false,
    default: null,
  },
  truncation: {
    param: 'truncation',
    required: false,
    default: true,
  },
  encoding_format: {
    param: 'encoding_format',
    required: false,
    default: null,
  },
};

interface VoyageEmbedResponse {
  object: 'list';
  data: Array<{ object: 'embedding'; embedding: number[]; index: number }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

export interface VoyageValidationErrorResponse {
  detail: string;
}

export const VoyageErrorResponseTransform: (
  response: VoyageValidationErrorResponse | any
) => ErrorResponse = (response) => {
  let errorField: string | null = null;

  let errorMessage = response.detail;
  let errorType = 'Invalid Request';

  return generateErrorResponse(
    {
      message: `${errorField ? `${errorField}: ` : ''}${errorMessage}`,
      type: errorType,
      param: null,
      code: null,
    },
    VOYAGE
  );
};

export const VoyageEmbedResponseTransform: (
  response: VoyageEmbedResponse | VoyageValidationErrorResponse | any,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if ('detail' in response && responseStatus !== 200) {
    return VoyageErrorResponseTransform(response);
  }

  if ('data' in response) {
    return {
      object: 'list',
      data: response.data,
      model: response.model,
      usage: {
        prompt_tokens: response.usage.total_tokens,
        total_tokens: response.usage.total_tokens,
      },
      provider: VOYAGE,
    };
  }

  return generateInvalidProviderResponseError(response, VOYAGE);
};
