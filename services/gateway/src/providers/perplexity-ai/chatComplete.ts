import { PERPLEXITY_AI } from '../../globals';
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

export const PerplexityAIChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'mistral-7b-instruct',
  },
  messages: {
    param: 'messages',
    required: true,
    default: [],
  },
  max_tokens: {
    param: 'max_tokens',
    required: true,
    min: 1,
  },
  temperature: {
    param: 'temperature',
    min: 0,
    max: 2,
  },
  top_p: {
    param: 'top_p',
    min: 0,
    max: 1,
  },
  top_k: {
    param: 'top_k',
    min: 0,
    max: 2048,
  },
  stream: {
    param: 'stream',
    default: false,
  },
  presence_penalty: {
    param: 'presence_penalty',
    min: -2,
    max: 2,
  },
  frequency_penalty: {
    param: 'repetition_penalty',
  },
  n: {
    param: 'n',
    max: 1,
    min: 1,
  },
};

interface PerplexityAIChatChoice {
  message: {
    role: string;
    content: string;
  };
  delta: {
    role: string;
    content: string;
  };
  index: number;
  finish_reason: string | null;
}

export interface PerplexityAIChatCompleteResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: PerplexityAIChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PerplexityAIErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

export interface PerplexityAIChatCompletionStreamChunk {
  id: string;
  model: string;
  object: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: PerplexityAIChatChoice[];
}

export const PerplexityAIChatCompleteResponseTransform: (
  response: PerplexityAIChatCompleteResponse | PerplexityAIErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response) => {
  if ('error' in response) {
    return generateErrorResponse(
      {
        message: response.error.message,
        type: response.error.type,
        param: null,
        code: response.error.code.toString(),
      },
      PERPLEXITY_AI
    );
  }

  if ('choices' in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: PERPLEXITY_AI,
      choices: [
        {
          message: {
            role: 'assistant',
            content: response.choices[0]?.message.content,
          },
          index: 0,
          logprobs: null,
          finish_reason: '',
        },
      ],
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, PERPLEXITY_AI);
};

export const PerplexityAIChatCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();

  const parsedChunk: PerplexityAIChatCompletionStreamChunk = JSON.parse(chunk);
  let returnChunk =
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: Math.floor(Date.now() / 1000),
      model: parsedChunk.model,
      provider: PERPLEXITY_AI,
      choices: [
        {
          delta: {
            role: parsedChunk.choices[0]?.delta.role,
            content: parsedChunk.choices[0]?.delta.content,
          },
          index: 0,
          finish_reason: parsedChunk.choices[0]?.finish_reason,
        },
      ],
    })}` + '\n\n';

  return returnChunk;
};
