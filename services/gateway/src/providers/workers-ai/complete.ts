import { Params } from '../../types/requestBody';
import { CompletionResponse, ErrorResponse, ProviderConfig } from '../types';
import { WORKERS_AI } from '../../globals';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const WorkersAiCompleteConfig: ProviderConfig = {
  prompt: {
    param: 'prompt',
    transform: (params: Params) => `\n\nHuman: ${params.prompt}\n\nAssistant:`,
    required: true,
  },
  stream: {
    param: 'stream',
    default: false,
  },
  raw: {
    param: 'raw',
  },
  max_tokens: {
    param: 'max_tokens',
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

interface WorkersAiCompleteResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: string[];
  messages: string[];
}

interface WorkersAiCompleteStreamResponse {
  response: string;
  p?: string;
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

export const WorkersAiCompleteResponseTransform: (
  response: WorkersAiCompleteResponse | WorkersAiErrorResponse,
  responseStatus: number
) => CompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = WorkersAiErrorResponseTransform(
      response as WorkersAiErrorResponse
    );
    if (errorResponse) return errorResponse;
  }

  if ('result' in response) {
    return {
      id: Date.now().toString(),
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: '',
      provider: WORKERS_AI,
      choices: [
        {
          text: response.result.response,
          index: 0,
          logprobs: null,
          finish_reason: '',
        },
      ],
    };
  }

  return generateInvalidProviderResponseError(response, WORKERS_AI);
};

export const WorkersAiCompleteStreamChunkTransform: (
  response: string
) => string | undefined = (responseChunk) => {
  let chunk = responseChunk.trim();

  if (chunk.startsWith('data: [DONE]')) {
    return 'data: [DONE]\n\n';
  }

  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();

  const parsedChunk: WorkersAiCompleteStreamResponse = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: '',
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: '', // TODO: find a way to send the cohere embedding model name back
      provider: WORKERS_AI,
      choices: [
        {
          text: parsedChunk.response,
          index: 0,
          logprobs: null,
          finish_reason: '',
        },
      ],
    })}` + '\n\n'
  );
};
