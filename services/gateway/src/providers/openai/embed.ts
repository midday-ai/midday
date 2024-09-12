import { OPEN_AI } from '../../globals';
import { EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import { OpenAIErrorResponseTransform } from './utils';

// TODOS: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

export const OpenAIEmbedConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'text-embedding-ada-002',
  },
  input: {
    param: 'input',
    required: true,
  },
  encoding_format: {
    param: 'encoding_format',
  },
  dimensions: {
    param: 'dimensions',
  },
  user: {
    param: 'user',
  },
};

interface OpenAIEmbedResponse extends EmbedResponse {}

export const OpenAIEmbedResponseTransform: (
  response: OpenAIEmbedResponse | ErrorResponse,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200 && 'error' in response) {
    return OpenAIErrorResponseTransform(response, OPEN_AI);
  }

  return response;
};
