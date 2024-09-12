import { WORKERS_AI } from '../../globals';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const WorkersAiChatCompleteConfig: ProviderConfig = {
  messages: {
    param: 'messages',
    default: '',
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

interface WorkersAiChatCompleteResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: string[];
  messages: string[];
}

interface WorkersAiChatCompleteStreamResponse {
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

// TODO: cloudflare do not return the usage
export const WorkersAiChatCompleteResponseTransform: (
  response: WorkersAiChatCompleteResponse | WorkersAiErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = WorkersAiErrorResponseTransform(
      response as WorkersAiErrorResponse
    );
    if (errorResponse) return errorResponse;
  }

  if ('result' in response) {
    return {
      id: Date.now().toString(),
      object: 'chat_completion',
      created: Math.floor(Date.now() / 1000),
      model: '', // TODO: find a way to send the cohere embedding model name back
      provider: WORKERS_AI,
      choices: [
        {
          message: { role: 'assistant', content: response.result.response },
          index: 0,
          logprobs: null,
          finish_reason: '',
        },
      ],
    };
  }

  return generateInvalidProviderResponseError(response, WORKERS_AI);
};

export const WorkersAiChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string
) => string | undefined = (responseChunk, fallbackId) => {
  let chunk = responseChunk.trim();

  if (chunk.startsWith('data: [DONE]')) {
    return 'data: [DONE]\n\n';
  }

  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();

  const parsedChunk: WorkersAiChatCompleteStreamResponse = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: fallbackId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: '',
      provider: WORKERS_AI,
      choices: [
        {
          delta: {
            content: parsedChunk.response,
          },
          index: 0,
          logprobs: null,
          finish_reason: null,
        },
      ],
    })}` + '\n\n'
  );
};
