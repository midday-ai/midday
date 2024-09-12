import { TOGETHER_AI } from '../../globals';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

// TODOS: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

export const TogetherAIChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'togethercomputer/RedPajama-INCITE-Chat-3B-v1',
  },
  messages: {
    param: 'messages',
    required: true,
    default: '',
  },
  max_tokens: {
    param: 'max_tokens',
    required: true,
    default: 128,
    min: 1,
  },
  stop: {
    param: 'stop',
  },
  temperature: {
    param: 'temperature',
  },
  top_p: {
    param: 'top_p',
  },
  top_k: {
    param: 'top_k',
  },
  frequency_penalty: {
    param: 'repetition_penalty',
  },
  stream: {
    param: 'stream',
    default: false,
  },
  logprobs: {
    param: 'logprobs',
  },
  tools: {
    param: 'tools',
  },
  tool_choice: {
    param: 'tool_choice',
  },
  response_format: {
    param: 'response_format',
  },
};

export interface TogetherAIChatCompleteResponse extends ChatCompletionResponse {
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TogetherAIErrorResponse {
  model: string;
  job_id: string;
  request_id: string;
  error: string;
  message?: string;
  type?: string;
}

export interface TogetherAIOpenAICompatibleErrorResponse
  extends ErrorResponse {}

export interface TogetherAIChatCompletionStreamChunk {
  id: string;
  request_id: string;
  object: string;
  choices: {
    index: number;
    delta: {
      content: string;
    };
  }[];
}

export const TogetherAIErrorResponseTransform: (
  response: TogetherAIErrorResponse | TogetherAIOpenAICompatibleErrorResponse
) => ErrorResponse | false = (response) => {
  if ('error' in response && typeof response.error === 'string') {
    return generateErrorResponse(
      { message: response.error, type: null, param: null, code: null },
      TOGETHER_AI
    );
  }

  if ('error' in response && typeof response.error === 'object') {
    return generateErrorResponse(
      {
        message: response.error?.message || '',
        type: response.error?.type || null,
        param: response.error?.param || null,
        code: response.error?.code || null,
      },
      TOGETHER_AI
    );
  }

  if ('message' in response && response.message) {
    return generateErrorResponse(
      {
        message: response.message,
        type: response.type || null,
        param: null,
        code: null,
      },
      TOGETHER_AI
    );
  }

  return false;
};

export const TogetherAIChatCompleteResponseTransform: (
  response:
    | TogetherAIChatCompleteResponse
    | TogetherAIErrorResponse
    | TogetherAIOpenAICompatibleErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = TogetherAIErrorResponseTransform(
      response as TogetherAIErrorResponse
    );
    if (errorResponse) return errorResponse;
  }

  if ('choices' in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: TOGETHER_AI,
      choices: response.choices.map((choice) => {
        return {
          message: {
            role: 'assistant',
            content: choice.message.content,
            tool_calls: choice.message.tool_calls
              ? choice.message.tool_calls.map((toolCall: any) => ({
                  id: toolCall.id,
                  type: toolCall.type,
                  function: toolCall.function,
                }))
              : null,
          },
          index: 0,
          logprobs: null,
          finish_reason: choice.finish_reason,
        };
      }),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, TOGETHER_AI);
};

export const TogetherAIChatCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();
  if (chunk === '[DONE]') {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: TogetherAIChatCompletionStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: Math.floor(Date.now() / 1000),
      model: '',
      provider: TOGETHER_AI,
      choices: [
        {
          delta: {
            content: parsedChunk.choices[0]?.delta.content,
          },
          index: 0,
          finish_reason: '',
        },
      ],
    })}` + '\n\n'
  );
};
