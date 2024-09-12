import { ANYSCALE } from '../../globals';
import { CompletionResponse, ErrorResponse, ProviderConfig } from '../types';
import { generateInvalidProviderResponseError } from '../utils';
import {
  AnyscaleErrorResponse,
  AnyscaleErrorResponseTransform,
  AnyscaleValidationErrorResponse,
} from './chatComplete';

export const AnyscaleCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'Meta-Llama/Llama-Guard-7b',
  },
  prompt: {
    param: 'prompt',
    default: '',
  },
  max_tokens: {
    param: 'max_tokens',
    default: 100,
    min: 0,
  },
  temperature: {
    param: 'temperature',
    default: 1,
    min: 0,
    max: 2,
  },
  top_p: {
    param: 'top_p',
    default: 1,
    min: 0,
    max: 1,
  },
  n: {
    param: 'n',
    default: 1,
  },
  stream: {
    param: 'stream',
    default: false,
  },
  logprobs: {
    param: 'logprobs',
    max: 5,
  },
  echo: {
    param: 'echo',
    default: false,
  },
  stop: {
    param: 'stop',
  },
  presence_penalty: {
    param: 'presence_penalty',
    min: -2,
    max: 2,
  },
  frequency_penalty: {
    param: 'frequency_penalty',
    min: -2,
    max: 2,
  },
  best_of: {
    param: 'best_of',
  },
  logit_bias: {
    param: 'logit_bias',
  },
  user: {
    param: 'user',
  },
};

interface AnyscaleCompleteResponse extends CompletionResponse {}
interface AnyscaleCompleteStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    text: string;
    index: number;
    logprobs: Record<string, any>;
    finish_reason: string | null;
  }[];
}

export const AnyscaleCompleteResponseTransform: (
  response:
    | AnyscaleCompleteResponse
    | AnyscaleErrorResponse
    | AnyscaleValidationErrorResponse,
  responseStatus: number
) => CompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = AnyscaleErrorResponseTransform(
      response as AnyscaleErrorResponse | AnyscaleValidationErrorResponse
    );
    if (errorResposne) return errorResposne;
  }

  if ('choices' in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: ANYSCALE,
      choices: response.choices,
      usage: response.usage,
    };
  }

  return generateInvalidProviderResponseError(response, ANYSCALE);
};

export const AnyscaleCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();
  if (chunk === '[DONE]') {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: AnyscaleCompleteStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: parsedChunk.created,
      model: parsedChunk.model,
      provider: ANYSCALE,
      choices: parsedChunk.choices,
    })}` + '\n\n'
  );
};
