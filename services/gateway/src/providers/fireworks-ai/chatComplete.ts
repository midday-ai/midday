import { FIREWORKS_AI } from '../../globals';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const FireworksAIChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
  },
  messages: {
    param: 'messages',
    required: true,
    default: [],
  },
  tools: {
    param: 'tools',
  },
  max_tokens: {
    param: 'max_tokens',
    default: 200,
    min: 1,
  },
  prompt_truncate_len: {
    param: 'prompt_truncate_len',
    default: 1500,
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
  top_k: {
    param: 'top_k',
    min: 1,
    max: 128,
  },
  frequency_penalty: {
    param: 'frequency_penalty',
    min: -2,
    max: 2,
  },
  presence_penalty: {
    param: 'presence_penalty',
    min: -2,
    max: 2,
  },
  n: {
    param: 'n',
    default: 1,
    min: 1,
    max: 128,
  },
  stop: {
    param: 'stop',
  },
  response_format: {
    param: 'response_format',
  },
  stream: {
    param: 'stream',
    default: false,
  },
  context_length_exceeded_behavior: {
    param: 'context_length_exceeded_behavior',
  },
  user: {
    param: 'user',
  },
};

interface FireworksAIChatCompleteResponse extends ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface FireworksAIValidationErrorResponse {
  fault: {
    faultstring: string;
    detail: {
      errorcode: string;
    };
  };
}

export interface FireworksAIErrorResponse extends ErrorResponse {}

export interface FireworksAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta: {
      role?: string | null;
      content?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
  usage: null | {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const FireworksAIErrorResponseTransform: (
  response: FireworksAIValidationErrorResponse | FireworksAIErrorResponse
) => ErrorResponse = (response) => {
  if ('fault' in response) {
    return generateErrorResponse(
      {
        message: response.fault.faultstring,
        type: null,
        param: null,
        code: response.fault.detail.errorcode,
      },
      FIREWORKS_AI
    );
  } else if ('detail' in response) {
    return generateErrorResponse(
      {
        message: response.detail as string,
        type: null,
        param: null,
        code: null,
      },
      FIREWORKS_AI
    );
  }
  return generateErrorResponse(response.error, FIREWORKS_AI);
};

export const FireworksAIChatCompleteResponseTransform: (
  response:
    | FireworksAIChatCompleteResponse
    | FireworksAIValidationErrorResponse
    | FireworksAIErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    return FireworksAIErrorResponseTransform(
      response as FireworksAIValidationErrorResponse | FireworksAIErrorResponse
    );
  }

  if ('choices' in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: FIREWORKS_AI,
      choices: response.choices.map((c) => ({
        index: c.index,
        message: {
          role: c.message.role,
          content: c.message.content,
          tool_calls: c.message.tool_calls,
        },
        finish_reason: c.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      },
    };
  }
  return generateInvalidProviderResponseError(response, FIREWORKS_AI);
};

export const FireworksAIChatCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();
  if (chunk === '[DONE]') {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: FireworksAIStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: parsedChunk.created,
      model: parsedChunk.model,
      provider: FIREWORKS_AI,
      choices: [
        {
          index: parsedChunk.choices[0].index,
          delta: parsedChunk.choices[0].delta,
          finish_reason: parsedChunk.choices[0].finish_reason,
        },
      ],
      ...(parsedChunk.usage ? { usage: parsedChunk.usage } : {}),
    })}` + '\n\n'
  );
};
