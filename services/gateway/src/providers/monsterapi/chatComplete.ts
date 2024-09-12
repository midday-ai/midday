import { MONSTERAPI } from '../../globals';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const MonsterAPIChatCompleteConfig: ProviderConfig = {
  top_k: {
    param: 'top_k',
    min: 1,
    max: 20,
  },
  top_p: {
    param: 'top_p',
    min: 0,
    max: 1,
  },
  temperature: {
    param: 'temperature',
    min: 0,
    max: 1,
  },
  max_length: {
    param: 'max_length',
    min: 1,
    max: 2048,
  },
  repetition_penalty: {
    param: 'repetition_penalty',
    min: 0,
  },
  beam_size: {
    param: 'beam_size',
    min: 1,
  },
  model: {
    param: 'model',
    required: true,
    default: 'mistralai/Mistral-7B-Instruct-v0.2',
  },
  messages: {
    param: 'messages',
    required: true,
    default: [],
  },
};

export interface MonsterAPIErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

export const MonsterAPIChatCompleteResponseTransform: (
  response: ChatCompletionResponse | MonsterAPIErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if ('error' in response) {
    return generateErrorResponse(
      {
        message: response.error.message,
        type: response.error.type,
        param: null,
        code: response.error.code.toString(),
      },
      MONSTERAPI
    );
  }

  if ('choices' in response) {
    return {
      ...response,
      provider: MONSTERAPI,
    };
  }

  return generateInvalidProviderResponseError(response, MONSTERAPI);
};
