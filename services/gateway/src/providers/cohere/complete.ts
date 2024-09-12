import { COHERE } from '../../globals';
import { CompletionResponse, ErrorResponse, ProviderConfig } from '../types';
import { generateErrorResponse } from '../utils';

// TODOS: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

export const CohereCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    default: 'command',
    required: true,
  },
  prompt: {
    param: 'prompt',
    required: true,
  },
  max_tokens: {
    param: 'max_tokens',
    default: 20,
    min: 1,
  },
  temperature: {
    param: 'temperature',
    default: 0.75,
    min: 0,
    max: 5,
  },
  top_p: {
    param: 'p',
    default: 0.75,
    min: 0,
    max: 1,
  },
  top_k: {
    param: 'k',
    default: 0,
    max: 500,
  },
  frequency_penalty: {
    param: 'frequency_penalty',
    default: 0,
    min: 0,
    max: 1,
  },
  presence_penalty: {
    param: 'presence_penalty',
    default: 0,
    min: 0,
    max: 1,
  },
  logit_bias: {
    param: 'logit_bias',
  },
  n: {
    param: 'num_generations',
    default: 1,
    min: 1,
    max: 5,
  },
  stop: {
    param: 'end_sequences',
  },
  stream: {
    param: 'stream',
    default: false,
  },
};

interface CohereCompleteResponse {
  id: string;
  generations: {
    id: string;
    text: string;
  }[];
  prompt: string;
  meta: {
    api_version: {
      version: string;
    };
  };
  message?: string;
  status?: number;
}

export interface CohereStreamChunk {
  id?: string;
  response: {
    generations?: {
      id: string;
      text: string;
      finish_reason: boolean;
    }[];
  };
  prompt?: string;
  meta?: {
    api_version: {
      version: string;
    };
  };
  text: string;
  is_finished: boolean;
  index?: number;
}

export const CohereCompleteResponseTransform: (
  response: CohereCompleteResponse,
  responseStatus: number
) => CompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.message || '',
        type: null,
        param: null,
        code: null,
      },
      COHERE
    );
  }

  return {
    id: response.id,
    object: 'text_completion',
    created: Math.floor(Date.now() / 1000),
    model: 'Unknown',
    provider: COHERE,
    choices: response.generations.map((generation, index) => ({
      text: generation.text,
      index: index,
      logprobs: null,
      finish_reason: 'length',
    })),
  };
};

export const CohereCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string
) => string = (responseChunk, fallbackId) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();
  const parsedChunk: CohereStreamChunk = JSON.parse(chunk);

  // discard the last cohere chunk as it sends the whole response combined.
  if (parsedChunk.is_finished) {
    return '';
  }

  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id ?? fallbackId,
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: '',
      provider: COHERE,
      choices: [
        {
          text:
            parsedChunk.response?.generations?.[0]?.text ?? parsedChunk.text,
          index: parsedChunk.index ?? 0,
          logprobs: null,
          finish_reason:
            parsedChunk.response?.generations?.[0]?.finish_reason ?? null,
        },
      ],
    })}` + '\n\n'
  );
};
