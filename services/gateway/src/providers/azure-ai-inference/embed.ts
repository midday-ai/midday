import { EmbedResponse } from '../../types/embedRequestBody';
import { OpenAIErrorResponseTransform } from '../openai/utils';
import { ErrorResponse, ProviderConfig } from '../types';

export const AzureAIInferenceEmbedConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: false,
  },
  input: {
    param: 'input',
    required: true,
  },
  user: {
    param: 'user',
  },
};

interface AzureAIInferenceEmbedResponse extends EmbedResponse {}

export const AzureAIInferenceEmbedResponseTransform = (provider: string) => {
  const transformer: (
    response: AzureAIInferenceEmbedResponse | ErrorResponse,
    responseStatus: number
  ) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
    if (responseStatus !== 200 && 'error' in response) {
      return OpenAIErrorResponseTransform(response, provider);
    }

    return { ...response, provider: provider };
  };

  return transformer;
};
