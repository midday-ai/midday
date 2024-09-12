import { DEEPINFRA } from '../../globals';
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
// TODOS: this configuration might have to check on the max value of n

export const DeepInfraChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'deepinfra/airoboros-70b',
  },
  messages: {
    param: 'messages',
    required: true,
    default: [],
  },
  frequency_penalty: {
    param: 'frequency_penalty',
    default: 0,
    min: -2,
    max: 2,
  },
  max_tokens: {
    param: 'max_tokens',
    default: 100,
    min: 1,
  },
  n: {
    param: 'n',
    default: 1,
    min: 1,
    max: 1,
  },
  presence_penalty: {
    param: 'presence_penalty',
    min: -2,
    max: 2,
    default: 0,
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
  stop: {
    param: 'stop',
    default: null,
  },
  stream: {
    param: 'stream',
    default: false,
  },
};

interface DeepInfraChatCompleteResponse extends ChatCompletionResponse {
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

export interface DeepInfraErrorResponse {
  detail: {
    loc: string[];
    msg: string;
    type: string;
  }[];
}

interface DeepInfraStreamChunk {
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
}

export const DeepInfraChatCompleteResponseTransform: (
  response: DeepInfraChatCompleteResponse | DeepInfraErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (
    'detail' in response &&
    responseStatus !== 200 &&
    response.detail.length
  ) {
    let firstError: Record<string, any> | undefined;
    let errorField: string | null = null;
    let errorMessage: string | undefined;
    let errorType: string | null = null;

    if (Array.isArray(response.detail)) {
      [firstError] = response.detail;
      errorField = firstError?.loc?.join('.') ?? '';
      errorMessage = firstError.msg;
      errorType = firstError.type;
    } else {
      errorMessage = response.detail;
    }

    return generateErrorResponse(
      {
        message: `${errorField ? `${errorField}: ` : ''}${errorMessage}`,
        type: errorType,
        param: null,
        code: null,
      },
      DEEPINFRA
    );
  }

  if ('choices' in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: DEEPINFRA,
      choices: response.choices.map((c) => ({
        index: c.index,
        message: {
          role: c.message.role,
          content: c.message.content,
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

  return generateInvalidProviderResponseError(response, DEEPINFRA);
};

export const DeepInfraChatCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();
  if (chunk === '[DONE]') {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: DeepInfraStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: parsedChunk.created,
      model: parsedChunk.model,
      provider: DEEPINFRA,
      choices: [
        {
          index: parsedChunk.choices[0].index,
          delta: parsedChunk.choices[0].delta,
          finish_reason: parsedChunk.choices[0].finish_reason,
        },
      ],
    })}` + '\n\n'
  );
};
