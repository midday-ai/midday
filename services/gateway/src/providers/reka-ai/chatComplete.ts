import { REKA_AI } from '../../globals';
import { Params } from '../../types/requestBody';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

interface RekaMessageItem {
  text: string;
  media_url?: string;
  type: 'human' | 'model';
}

export const RekaAIChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model_name',
    required: true,
    default: 'reka-flash',
  },
  messages: {
    param: 'conversation_history',
    transform: (params: Params) => {
      const messages: RekaMessageItem[] = [];
      let lastType: 'human' | 'model' | undefined;

      const addMessage = ({
        type,
        text,
        media_url,
      }: {
        type: 'human' | 'model';
        text: string;
        media_url?: string;
      }) => {
        // NOTE: can't have more than one image in conversation history
        if (media_url && messages[0].media_url) {
          return;
        }

        const newMessage: RekaMessageItem = { type, text, media_url };

        if (lastType === type) {
          const placeholder: RekaMessageItem = {
            type: type === 'human' ? 'model' : 'human',
            text: 'Placeholder for alternation',
          };
          media_url
            ? messages.unshift(placeholder)
            : messages.push(placeholder);
        }

        // NOTE: image need to be first
        media_url ? messages.unshift(newMessage) : messages.push(newMessage);
        lastType = type;
      };

      params.messages?.forEach((message) => {
        const currentType: 'human' | 'model' =
          message.role === 'user' ? 'human' : 'model';

        if (!Array.isArray(message.content)) {
          addMessage({ type: currentType, text: message.content || '' });
        } else {
          message.content.forEach((item) => {
            addMessage({
              type: currentType,
              text: item.text || '',
              media_url: item.image_url?.url,
            });
          });
        }
      });

      if (messages[0].type !== 'human') {
        messages.unshift({
          type: 'human',
          text: 'Placeholder for alternation',
        });
      }
      return messages;
    },
  },
  max_tokens: {
    param: 'request_output_len',
  },
  temperature: {
    param: 'temperature',
  },
  top_p: {
    param: 'runtime_top_p',
  },
  stop: {
    param: 'stop_words',
    transform: (params: Params) => {
      if (params.stop && !Array.isArray(params.stop)) {
        return [params.stop];
      }

      return params.stop;
    },
  },
  seed: {
    param: 'random_seed',
  },
  frequency_penalty: {
    param: 'frequency_penalty',
  },
  presence_penalty: {
    param: 'presence_penalty',
  },
  // the following are reka specific
  top_k: {
    param: 'runtime_top_k',
  },
  length_penalty: {
    param: 'length_penalty',
  },
  retrieval_dataset: {
    param: 'retrieval_dataset',
  },
  use_search_engine: {
    param: 'use_search_engine',
  },
};

export interface RekaAIChatCompleteResponse {
  type: string;
  text: string;
  finish_reason: string;
  metadata: {
    input_tokens: number;
    generated_tokens: number;
  };
}

export interface RekaAIErrorResponse {
  detail: any; // could be string or array
}

export const RekaAIChatCompleteResponseTransform: (
  response: RekaAIChatCompleteResponse | RekaAIErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response) => {
  if ('detail' in response) {
    return generateErrorResponse(
      {
        message: JSON.stringify(response.detail),
        type: null,
        param: null,
        code: null,
      },
      REKA_AI
    );
  }

  if ('text' in response) {
    return {
      id: crypto.randomUUID(),
      object: 'chat_completion',
      created: Math.floor(Date.now() / 1000),
      model: 'Unknown',
      provider: REKA_AI,
      choices: [
        {
          message: {
            role: 'assistant',
            content: response.text,
          },
          index: 0,
          logprobs: null,
          finish_reason: response.finish_reason,
        },
      ],
      usage: {
        prompt_tokens: response.metadata.input_tokens,
        completion_tokens: response.metadata.generated_tokens,
        total_tokens:
          response.metadata.input_tokens + response.metadata.generated_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, REKA_AI);
};
