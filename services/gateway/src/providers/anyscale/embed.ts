import { ANYSCALE } from '../../globals';
import { EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import { generateInvalidProviderResponseError } from '../utils';
import {
  AnyscaleErrorResponse,
  AnyscaleErrorResponseTransform,
  AnyscaleValidationErrorResponse,
} from './chatComplete';

export const AnyscaleEmbedConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'thenlper/gte-large',
  },
  input: {
    param: 'input',
    default: '',
  },
  user: {
    param: 'user',
  },
};

export interface AnyscaleEmbedResponse extends EmbedResponse {}

export const AnyscaleEmbedResponseTransform: (
  response:
    | AnyscaleEmbedResponse
    | AnyscaleErrorResponse
    | AnyscaleValidationErrorResponse,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = AnyscaleErrorResponseTransform(
      response as AnyscaleErrorResponse | AnyscaleValidationErrorResponse
    );
    if (errorResposne) return errorResposne;
  }

  if ('data' in response) {
    return {
      object: response.object,
      data: response.data,
      model: response.model,
      usage: response.usage,
    };
  }

  return generateInvalidProviderResponseError(response, ANYSCALE);
};
