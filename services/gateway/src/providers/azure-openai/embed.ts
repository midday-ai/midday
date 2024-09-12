import { AZURE_OPEN_AI } from '../../globals';
import { EmbedResponse } from '../../types/embedRequestBody';
import { OpenAIErrorResponseTransform } from '../openai/utils';
import { ErrorResponse, ProviderConfig } from '../types';

// TODOS: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

export const AzureOpenAIEmbedConfig: ProviderConfig = {
  model: {
    param: 'model',
  },
  input: {
    param: 'input',
    required: true,
  },
  user: {
    param: 'user',
  },
};

interface AzureOpenAIEmbedResponse extends EmbedResponse {}

export const AzureOpenAIEmbedResponseTransform: (
  response: AzureOpenAIEmbedResponse | ErrorResponse,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200 && 'error' in response) {
    return OpenAIErrorResponseTransform(response, AZURE_OPEN_AI);
  }

  return response;
};
