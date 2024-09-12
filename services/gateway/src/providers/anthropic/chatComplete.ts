import { ANTHROPIC } from '../../globals';
import {
  Params,
  Message,
  ContentType,
  AnthropicPromptCache,
} from '../../types/requestBody';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';
import { AnthropicStreamState } from './types';

// TODO: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

interface AnthropicTool extends AnthropicPromptCache {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description: string;
      }
    >;
    required: string[];
  };
}

interface AnthropicToolResultContentItem {
  type: 'tool_result';
  tool_use_id: string;
  content?: string;
}

type AnthropicMessageContentItem = AnthropicToolResultContentItem | ContentType;

interface AnthropicMessage extends Message, AnthropicPromptCache {
  content?: string | AnthropicMessageContentItem[];
}

const transformAssistantMessage = (msg: Message): AnthropicMessage => {
  let content: AnthropicContentItem[] = [];
  const containsToolCalls = msg.tool_calls && msg.tool_calls.length;

  if (msg.content && typeof msg.content === 'string') {
    content.push({
      type: 'text',
      text: msg.content,
    });
  } else if (
    msg.content &&
    typeof msg.content === 'object' &&
    msg.content.length
  ) {
    if (msg.content[0].text) {
      content.push({
        type: 'text',
        text: msg.content[0].text,
      });
    }
  }
  if (containsToolCalls) {
    msg.tool_calls.forEach((toolCall: any) => {
      content.push({
        type: 'tool_use',
        name: toolCall.function.name,
        id: toolCall.id,
        input: JSON.parse(toolCall.function.arguments),
      });
    });
  }
  return {
    role: msg.role,
    content,
  };
};

const transformToolMessage = (msg: Message): AnthropicMessage => {
  return {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: msg.tool_call_id,
        content: msg.content as string,
      },
    ],
  };
};

export const AnthropicChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    default: 'claude-2.1',
    required: true,
  },
  messages: [
    {
      param: 'messages',
      required: true,
      transform: (params: Params) => {
        let messages: AnthropicMessage[] = [];
        // Transform the chat messages into a simple prompt
        if (!!params.messages) {
          params.messages.forEach((msg: Message & AnthropicPromptCache) => {
            if (msg.role === 'system') return;

            if (msg.role === 'assistant') {
              messages.push(transformAssistantMessage(msg));
            } else if (
              msg.content &&
              typeof msg.content === 'object' &&
              msg.content.length
            ) {
              const transformedMessage: Record<string, any> = {
                role: msg.role,
                content: [],
              };
              msg.content.forEach((item) => {
                if (item.type === 'text') {
                  transformedMessage.content.push({
                    type: item.type,
                    text: item.text,
                    ...((item as any).cache_control && {
                      cache_control: { type: 'ephemeral' },
                    }),
                  });
                } else if (
                  item.type === 'image_url' &&
                  item.image_url &&
                  item.image_url.url
                ) {
                  const parts = item.image_url.url.split(';');
                  if (parts.length === 2) {
                    const base64ImageParts = parts[1].split(',');
                    const base64Image = base64ImageParts[1];
                    const mediaTypeParts = parts[0].split(':');
                    if (mediaTypeParts.length === 2 && base64Image) {
                      const mediaType = mediaTypeParts[1];
                      transformedMessage.content.push({
                        type: 'image',
                        source: {
                          type: 'base64',
                          media_type: mediaType,
                          data: base64Image,
                        },
                        ...((item as any).cache_control && {
                          cache_control: { type: 'ephemeral' },
                        }),
                      });
                    }
                  }
                }
              });
              messages.push(transformedMessage as Message);
            } else if (msg.role === 'tool') {
              // even though anthropic supports images in tool results, openai doesn't support it yet
              messages.push(transformToolMessage(msg));
            } else {
              messages.push({
                role: msg.role,
                content: msg.content,
              });
            }
          });
        }

        return messages;
      },
    },
    {
      param: 'system',
      required: false,
      transform: (params: Params) => {
        let systemMessage: AnthropicMessage['content'] | string = '';
        // Transform the chat messages into a simple prompt
        if (!!params.messages) {
          params.messages.forEach((msg: Message & AnthropicPromptCache) => {
            if (
              msg.role === 'system' &&
              msg.content &&
              typeof msg.content === 'object' &&
              msg.content[0].text
            ) {
              systemMessage = [];
              msg.content.forEach((_msg) => {
                (systemMessage as Array<ContentType>)?.push({
                  text: _msg.text,
                  type: 'text',
                  ...((_msg as any)?.cache_control && {
                    cache_control: { type: 'ephemeral' },
                  }),
                });
              });
            } else if (
              msg.role === 'system' &&
              typeof msg.content === 'string'
            ) {
              systemMessage = msg.content;
            }
          });
        }
        return systemMessage;
      },
    },
  ],
  tools: {
    param: 'tools',
    required: false,
    transform: (params: Params) => {
      let tools: AnthropicTool[] = [];
      if (params.tools) {
        params.tools.forEach((tool) => {
          if (tool.function) {
            tools.push({
              name: tool.function.name,
              description: tool.function?.description || '',
              input_schema: {
                type: tool.function.parameters?.type || 'object',
                properties: tool.function.parameters?.properties || {},
                required: tool.function.parameters?.required || [],
              },
              ...(tool.cache_control && {
                cache_control: { type: 'ephemeral' },
              }),
            });
          }
        });
      }
      return tools;
    },
  },
  // None is not supported by Anthropic, defaults to auto
  tool_choice: {
    param: 'tool_choice',
    required: false,
    transform: (params: Params) => {
      if (params.tool_choice) {
        if (typeof params.tool_choice === 'string') {
          if (params.tool_choice === 'required') return { type: 'any' };
          else if (params.tool_choice === 'auto') return { type: 'auto' };
        } else if (typeof params.tool_choice === 'object') {
          return { type: 'tool', name: params.tool_choice.function.name };
        }
      }
      return null;
    },
  },
  max_tokens: {
    param: 'max_tokens',
    required: true,
  },
  temperature: {
    param: 'temperature',
    default: 1,
    min: 0,
    max: 1,
  },
  top_p: {
    param: 'top_p',
    default: -1,
    min: -1,
  },
  top_k: {
    param: 'top_k',
    default: -1,
  },
  stop: {
    param: 'stop_sequences',
  },
  stream: {
    param: 'stream',
    default: false,
  },
  user: {
    param: 'metadata.user_id',
  },
};

interface AnthropicErrorObject {
  type: string;
  message: string;
}

export interface AnthropicErrorResponse {
  type: string;
  error: AnthropicErrorObject;
}

interface AnthorpicTextContentItem {
  type: 'text';
  text: string;
}

interface AnthropicToolContentItem {
  type: 'tool_use';
  name: string;
  id: string;
  input: Record<string, any>;
}

type AnthropicContentItem = AnthorpicTextContentItem | AnthropicToolContentItem;

export interface AnthropicChatCompleteResponse {
  id: string;
  type: string;
  role: string;
  content: AnthropicContentItem[];
  stop_reason: string;
  model: string;
  stop_sequence: null | string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface AnthropicChatCompleteStreamResponse {
  type: string;
  index: number;
  delta: {
    type: string;
    text: string;
    partial_json?: string;
    stop_reason?: string;
  };
  content_block?: {
    type: string;
    id?: string;
    text?: string;
    name?: string;
    input?: {};
  };
  usage?: {
    output_tokens?: number;
    input_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  message?: {
    usage?: {
      output_tokens?: number;
      input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
}

export const AnthropicErrorResponseTransform: (
  response: AnthropicErrorResponse
) => ErrorResponse | undefined = (response) => {
  if ('error' in response) {
    return generateErrorResponse(
      {
        message: response.error?.message,
        type: response.error?.type,
        param: null,
        code: null,
      },
      ANTHROPIC
    );
  }

  return undefined;
};

// TODO: The token calculation is wrong atm
export const AnthropicChatCompleteResponseTransform: (
  response: AnthropicChatCompleteResponse | AnthropicErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = AnthropicErrorResponseTransform(
      response as AnthropicErrorResponse
    );
    if (errorResposne) return errorResposne;
  }

  if ('content' in response) {
    const {
      input_tokens = 0,
      output_tokens = 0,
      cache_creation_input_tokens,
      cache_read_input_tokens,
    } = response?.usage;

    const shouldSendCacheUsage =
      cache_creation_input_tokens || cache_read_input_tokens;

    let content = '';
    if (response.content.length && response.content[0].type === 'text') {
      content = response.content[0].text;
    }

    let toolCalls: any = [];
    response.content.forEach((item) => {
      if (item.type === 'tool_use') {
        toolCalls.push({
          id: item.id,
          type: 'function',
          function: {
            name: item.name,
            arguments: JSON.stringify(item.input),
          },
        });
      }
    });

    return {
      id: response.id,
      object: 'chat_completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      provider: ANTHROPIC,
      choices: [
        {
          message: {
            role: 'assistant',
            content,
            tool_calls: toolCalls.length ? toolCalls : undefined,
          },
          index: 0,
          logprobs: null,
          finish_reason: response.stop_reason,
        },
      ],
      usage: {
        prompt_tokens: input_tokens,
        completion_tokens: output_tokens,
        total_tokens: input_tokens + output_tokens,
        ...(shouldSendCacheUsage && {
          cache_read_input_tokens: cache_read_input_tokens,
          cache_creation_input_tokens: cache_creation_input_tokens,
        }),
      },
    };
  }

  return generateInvalidProviderResponseError(response, ANTHROPIC);
};

export const AnthropicChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string,
  streamState: AnthropicStreamState
) => string | undefined = (responseChunk, fallbackId, streamState) => {
  let chunk = responseChunk.trim();
  if (
    chunk.startsWith('event: ping') ||
    chunk.startsWith('event: content_block_stop')
  ) {
    return;
  }

  if (chunk.startsWith('event: message_stop')) {
    return 'data: [DONE]\n\n';
  }

  chunk = chunk.replace(/^event: content_block_delta[\r\n]*/, '');
  chunk = chunk.replace(/^event: content_block_start[\r\n]*/, '');
  chunk = chunk.replace(/^event: message_delta[\r\n]*/, '');
  chunk = chunk.replace(/^event: message_start[\r\n]*/, '');
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();

  const parsedChunk: AnthropicChatCompleteStreamResponse = JSON.parse(chunk);
  if (
    parsedChunk.type === 'content_block_start' &&
    parsedChunk.content_block?.type === 'text'
  ) {
    streamState.containsChainOfThoughtMessage = true;
    return;
  }

  const shouldSendCacheUsage =
    parsedChunk.message?.usage?.cache_read_input_tokens ||
    parsedChunk.message?.usage?.cache_creation_input_tokens;

  if (parsedChunk.type === 'message_start' && parsedChunk.message?.usage) {
    streamState.usage = {
      prompt_tokens: parsedChunk.message?.usage?.input_tokens,
      ...(shouldSendCacheUsage && {
        cache_read_input_tokens:
          parsedChunk.message?.usage?.cache_read_input_tokens,
        cache_creation_input_tokens:
          parsedChunk.message?.usage?.cache_creation_input_tokens,
      }),
    };
    return (
      `data: ${JSON.stringify({
        id: fallbackId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: '',
        provider: ANTHROPIC,
        choices: [
          {
            delta: {
              content: '',
            },
            index: 0,
            logprobs: null,
            finish_reason: null,
          },
        ],
      })}` + '\n\n'
    );
  }

  if (parsedChunk.type === 'message_delta' && parsedChunk.usage) {
    return (
      `data: ${JSON.stringify({
        id: fallbackId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: '',
        provider: ANTHROPIC,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: parsedChunk.delta?.stop_reason,
          },
        ],
        usage: {
          completion_tokens: parsedChunk.usage?.output_tokens,
          ...streamState.usage,
        },
      })}` + '\n\n'
    );
  }

  const toolCalls = [];
  const isToolBlockStart: boolean =
    parsedChunk.type === 'content_block_start' &&
    !!parsedChunk.content_block?.id;
  const isToolBlockDelta: boolean =
    parsedChunk.type === 'content_block_delta' &&
    !!parsedChunk.delta.partial_json;
  const toolIndex: number = streamState.containsChainOfThoughtMessage
    ? parsedChunk.index - 1
    : parsedChunk.index;

  if (isToolBlockStart && parsedChunk.content_block) {
    toolCalls.push({
      index: toolIndex,
      id: parsedChunk.content_block.id,
      type: 'function',
      function: {
        name: parsedChunk.content_block.name,
        arguments: '',
      },
    });
  } else if (isToolBlockDelta) {
    toolCalls.push({
      index: toolIndex,
      function: {
        arguments: parsedChunk.delta.partial_json,
      },
    });
  }

  return (
    `data: ${JSON.stringify({
      id: fallbackId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: '',
      provider: ANTHROPIC,
      choices: [
        {
          delta: {
            content: parsedChunk.delta?.text,
            tool_calls: toolCalls.length ? toolCalls : undefined,
          },
          index: 0,
          logprobs: null,
          finish_reason: parsedChunk.delta?.stop_reason ?? null,
        },
      ],
    })}` + '\n\n'
  );
};
