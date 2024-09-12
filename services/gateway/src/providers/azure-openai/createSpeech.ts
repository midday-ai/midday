import { OPEN_AI } from '../../globals';
import { ErrorResponse, ProviderConfig } from '../types';
import { OpenAIErrorResponseTransform } from '../openai/utils';

export const AzureOpenAICreateSpeechConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'tts-1',
  },
  input: {
    param: 'input',
    required: true,
  },
  voice: {
    param: 'voice',
    required: true,
    default: 'alloy',
  },
  response_format: {
    param: 'response_format',
    required: false,
    default: 'mp3',
  },
  speed: {
    param: 'speed',
    required: false,
    default: 1,
  },
};

export const AzureOpenAICreateSpeechResponseTransform: (
  response: Response | ErrorResponse,
  responseStatus: number
) => Response | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200 && 'error' in response) {
    return OpenAIErrorResponseTransform(response, OPEN_AI);
  }

  return response;
};
