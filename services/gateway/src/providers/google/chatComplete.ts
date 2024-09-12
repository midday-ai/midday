import { GOOGLE } from '../../globals';
import {
  ContentType,
  Message,
  OpenAIMessageRole,
  Params,
  ToolCall,
  ToolChoice,
} from '../../types/requestBody';
import { getMimeType } from '../google-vertex-ai/utils';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

const transformGenerationConfig = (params: Params) => {
  const generationConfig: Record<string, any> = {};
  if (params['temperature']) {
    generationConfig['temperature'] = params['temperature'];
  }
  if (params['top_p']) {
    generationConfig['topP'] = params['top_p'];
  }
  if (params['top_k']) {
    generationConfig['topK'] = params['top_k'];
  }
  if (params['max_tokens']) {
    generationConfig['maxOutputTokens'] = params['max_tokens'];
  }
  if (params['stop']) {
    generationConfig['stopSequences'] = params['stop'];
  }
  return generationConfig;
};

// models for which systemInstruction is not supported
export const SYSTEM_INSTRUCTION_DISABLED_MODELS = [
  'gemini-1.0-pro',
  'gemini-1.0-pro-001',
  'gemini-1.0-pro-latest',
  'gemini-1.0-pro-vision-latest',
  'gemini-pro',
  'gemini-pro-vision',
];

export type GoogleMessageRole = 'user' | 'model' | 'system' | 'function';

interface GoogleFunctionCallMessagePart {
  functionCall: GoogleGenerateFunctionCall;
}

interface GoogleFunctionResponseMessagePart {
  functionResponse: {
    name: string;
    response: {
      name?: string;
      content: string;
    };
  };
}

type GoogleMessagePart =
  | GoogleFunctionCallMessagePart
  | GoogleFunctionResponseMessagePart
  | { text: string };

export interface GoogleMessage {
  role: GoogleMessageRole;
  parts: GoogleMessagePart[];
}

export interface GoogleToolConfig {
  function_calling_config: {
    mode: GoogleToolChoiceType | undefined;
    allowed_function_names?: string[];
  };
}

export const transformOpenAIRoleToGoogleRole = (
  role: OpenAIMessageRole
): GoogleMessageRole => {
  switch (role) {
    case 'assistant':
      return 'model';
    case 'tool':
      return 'function';
    default:
      return role;
  }
};

type GoogleToolChoiceType = 'AUTO' | 'ANY' | 'NONE';

export const transformToolChoiceForGemini = (
  tool_choice: ToolChoice
): GoogleToolChoiceType | undefined => {
  if (typeof tool_choice === 'object' && tool_choice.type === 'function')
    return 'ANY';
  if (typeof tool_choice === 'string') {
    switch (tool_choice) {
      case 'auto':
        return 'AUTO';
      case 'none':
        return 'NONE';
      case 'required':
        return 'ANY';
    }
  }
  return undefined;
};

// TODOS: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

export const GoogleChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'gemini-pro',
  },
  messages: [
    {
      param: 'contents',
      default: '',
      transform: (params: Params) => {
        let lastRole: GoogleMessageRole | undefined;
        const messages: GoogleMessage[] = [];

        params.messages?.forEach((message: Message) => {
          // From gemini-1.5 onwards, systemInstruction is supported
          // Skipping system message and sending it in systemInstruction for gemini 1.5 models
          if (
            message.role === 'system' &&
            !SYSTEM_INSTRUCTION_DISABLED_MODELS.includes(params.model as string)
          )
            return;

          const role = transformOpenAIRoleToGoogleRole(message.role);
          let parts = [];

          if (message.role === 'assistant' && message.tool_calls) {
            message.tool_calls.forEach((tool_call: ToolCall) => {
              parts.push({
                functionCall: {
                  name: tool_call.function.name,
                  args: JSON.parse(tool_call.function.arguments),
                },
              });
            });
          } else if (
            message.role === 'tool' &&
            typeof message.content === 'string'
          ) {
            parts.push({
              functionResponse: {
                name: message.name ?? 'gateway-tool-filler-name',
                response: {
                  content: message.content,
                },
              },
            });
          } else if (message.content && typeof message.content === 'object') {
            message.content.forEach((c: ContentType) => {
              if (c.type === 'text') {
                parts.push({
                  text: c.text,
                });
              }
              if (c.type === 'image_url') {
                const { url } = c.image_url || {};
                if (!url) return;

                if (url.startsWith('data:')) {
                  const [mimeTypeWithPrefix, base64Image] =
                    url.split(';base64,');
                  const mimeType = mimeTypeWithPrefix.split(':')[1];

                  parts.push({
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Image,
                    },
                  });
                } else if (url.startsWith('gs://')) {
                  parts.push({
                    fileData: {
                      mimeType: getMimeType(url),
                      fileUri: url,
                    },
                  });
                } else {
                  // NOTE: This block is kept to maintain backward compatibility
                  // Earlier we were assuming that all images will be base64 with image/jpeg mimeType
                  parts.push({
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: c.image_url?.url,
                    },
                  });
                }
              }
            });
          } else if (typeof message.content === 'string') {
            parts.push({
              text: message.content,
            });
          }

          // @NOTE: This takes care of the "Please ensure that multiturn requests alternate between user and model."
          // error that occurs when we have multiple user messages in a row.
          const shouldCombineMessages =
            lastRole === role && !params.model?.includes('vision');

          if (shouldCombineMessages) {
            messages[messages.length - 1].parts.push(...parts);
          } else {
            messages.push({ role, parts });
          }

          lastRole = role;
        });
        return messages;
      },
    },
    {
      param: 'systemInstruction',
      default: '',
      transform: (params: Params) => {
        // systemInstruction is only supported from gemini 1.5 models
        if (SYSTEM_INSTRUCTION_DISABLED_MODELS.includes(params.model as string))
          return;

        const firstMessage = params.messages?.[0] || null;

        if (!firstMessage) return;

        if (
          firstMessage.role === 'system' &&
          typeof firstMessage.content === 'string'
        ) {
          return {
            parts: [
              {
                text: firstMessage.content,
              },
            ],
            role: 'system',
          };
        }

        if (
          firstMessage.role === 'system' &&
          typeof firstMessage.content === 'object' &&
          firstMessage.content?.[0]?.text
        ) {
          return {
            parts: [
              {
                text: firstMessage.content?.[0].text,
              },
            ],
            role: 'system',
          };
        }

        return;
      },
    },
  ],
  temperature: {
    param: 'generationConfig',
    transform: (params: Params) => transformGenerationConfig(params),
  },
  top_p: {
    param: 'generationConfig',
    transform: (params: Params) => transformGenerationConfig(params),
  },
  top_k: {
    param: 'generationConfig',
    transform: (params: Params) => transformGenerationConfig(params),
  },
  max_tokens: {
    param: 'generationConfig',
    transform: (params: Params) => transformGenerationConfig(params),
  },
  stop: {
    param: 'generationConfig',
    transform: (params: Params) => transformGenerationConfig(params),
  },
  tools: {
    param: 'tools',
    default: '',
    transform: (params: Params) => {
      const functionDeclarations: any = [];
      params.tools?.forEach((tool) => {
        if (tool.type === 'function') {
          functionDeclarations.push(tool.function);
        }
      });
      return { functionDeclarations };
    },
  },
  tool_choice: {
    param: 'tool_config',
    default: '',
    transform: (params: Params) => {
      if (params.tool_choice) {
        const allowedFunctionNames: string[] = [];
        if (
          typeof params.tool_choice === 'object' &&
          params.tool_choice.type === 'function'
        ) {
          allowedFunctionNames.push(params.tool_choice.function.name);
        }
        const toolConfig: GoogleToolConfig = {
          function_calling_config: {
            mode: transformToolChoiceForGemini(params.tool_choice),
          },
        };
        if (allowedFunctionNames.length > 0) {
          toolConfig.function_calling_config.allowed_function_names =
            allowedFunctionNames;
        }
        return toolConfig;
      }
    },
  },
};

export interface GoogleErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
    details: Array<Record<string, any>>;
  };
}

interface GoogleGenerateFunctionCall {
  name: string;
  args: Record<string, any>;
}

interface GoogleGenerateContentResponse {
  candidates: {
    content: {
      parts: {
        text?: string;
        functionCall?: GoogleGenerateFunctionCall;
      }[];
    };
    finishReason: string;
    index: 0;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback: {
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export const GoogleErrorResponseTransform: (
  response: GoogleErrorResponse,
  provider?: string
) => ErrorResponse | undefined = (response, provider = GOOGLE) => {
  if ('error' in response) {
    return generateErrorResponse(
      {
        message: response.error.message ?? '',
        type: response.error.status ?? null,
        param: null,
        code: response.error.status ?? null,
      },
      provider
    );
  }

  return undefined;
};

export const GoogleChatCompleteResponseTransform: (
  response: GoogleGenerateContentResponse | GoogleErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = GoogleErrorResponseTransform(
      response as GoogleErrorResponse
    );
    if (errorResposne) return errorResposne;
  }

  if ('candidates' in response) {
    return {
      id: 'portkey-' + crypto.randomUUID(),
      object: 'chat_completion',
      created: Math.floor(Date.now() / 1000),
      model: 'Unknown',
      provider: 'google',
      choices:
        response.candidates?.map((generation) => {
          let message: Message = { role: 'assistant', content: '' };
          if (generation.content?.parts[0]?.text) {
            message = {
              role: 'assistant',
              content: generation.content.parts[0]?.text,
            };
          } else if (generation.content?.parts[0]?.functionCall) {
            message = {
              role: 'assistant',
              tool_calls: generation.content.parts.map((part) => {
                if (part.functionCall) {
                  return {
                    id: 'portkey-' + crypto.randomUUID(),
                    type: 'function',
                    function: {
                      name: part.functionCall.name,
                      arguments: JSON.stringify(part.functionCall.args),
                    },
                  };
                }
              }),
            };
          }
          return {
            message: message,
            index: generation.index,
            finish_reason: generation.finishReason,
          };
        }) ?? [],
      usage: {
        prompt_tokens: response.usageMetadata.promptTokenCount,
        completion_tokens: response.usageMetadata.candidatesTokenCount,
        total_tokens: response.usageMetadata.totalTokenCount,
      },
    };
  }

  return generateInvalidProviderResponseError(response, GOOGLE);
};

export const GoogleChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string
) => string = (responseChunk, fallbackId) => {
  let chunk = responseChunk.trim();
  if (chunk.startsWith('[')) {
    chunk = chunk.slice(1);
  }

  if (chunk.endsWith(',')) {
    chunk = chunk.slice(0, chunk.length - 1);
  }
  if (chunk.endsWith(']')) {
    chunk = chunk.slice(0, chunk.length - 2);
  }
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();
  if (chunk === '[DONE]') {
    return `data: ${chunk}\n\n`;
  }

  const parsedChunk: GoogleGenerateContentResponse = JSON.parse(chunk);

  return (
    `data: ${JSON.stringify({
      id: fallbackId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: '',
      provider: 'google',
      choices:
        parsedChunk.candidates?.map((generation) => {
          let message: Message = { role: 'assistant', content: '' };
          if (generation.content.parts[0]?.text) {
            message = {
              role: 'assistant',
              content: generation.content.parts[0]?.text,
            };
          } else if (generation.content.parts[0]?.functionCall) {
            message = {
              role: 'assistant',
              tool_calls: generation.content.parts.map((part, idx) => {
                if (part.functionCall) {
                  return {
                    index: idx,
                    id: 'portkey-' + crypto.randomUUID(),
                    type: 'function',
                    function: {
                      name: part.functionCall.name,
                      arguments: JSON.stringify(part.functionCall.args),
                    },
                  };
                }
              }),
            };
          }
          return {
            delta: message,
            index: generation.index,
            finish_reason: generation.finishReason,
          };
        }) ?? [],
      usage: {
        prompt_tokens: parsedChunk.usageMetadata.promptTokenCount,
        completion_tokens: parsedChunk.usageMetadata.candidatesTokenCount,
        total_tokens: parsedChunk.usageMetadata.totalTokenCount,
      },
    })}` + '\n\n'
  );
};
