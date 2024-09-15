import { BEDROCK } from "../../globals";
import { ContentType, Message, Params } from "../../types/requestBody";
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from "../types";
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from "../utils";
import {
  BedrockAI21CompleteResponse,
  BedrockCohereCompleteResponse,
  BedrockCohereStreamChunk,
  BedrockLlamaCompleteResponse,
  BedrockLlamaStreamChunk,
  BedrockTitanCompleteResponse,
  BedrockTitanStreamChunk,
  BedrockMistralCompleteResponse,
  BedrocMistralStreamChunk,
} from "./complete";
import { BedrockErrorResponse } from "./embed";

interface AnthropicTool {
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
  type: "tool_result";
  tool_use_id: string;
  content?: string;
}

type AnthropicMessageContentItem = AnthropicToolResultContentItem | ContentType;

interface AnthropicMessage extends Message {
  content?: string | AnthropicMessageContentItem[];
}

interface AnthorpicTextContentItem {
  type: "text";
  text: string;
}

interface AnthropicToolContentItem {
  type: "tool_use";
  name: string;
  id: string;
  input: Record<string, any>;
}

type AnthropicContentItem = AnthorpicTextContentItem | AnthropicToolContentItem;

const transformAssistantMessageForAnthropic = (
  msg: Message,
): AnthropicMessage => {
  let content: AnthropicContentItem[] = [];
  const containsToolCalls = msg.tool_calls && msg.tool_calls.length;

  if (msg.content && typeof msg.content === "string") {
    content.push({
      type: "text",
      text: msg.content,
    });
  } else if (
    msg.content &&
    typeof msg.content === "object" &&
    msg.content.length
  ) {
    if (msg.content[0].text) {
      content.push({
        type: "text",
        text: msg.content[0].text,
      });
    }
  }
  if (containsToolCalls) {
    msg.tool_calls.forEach((toolCall: any) => {
      content.push({
        type: "tool_use",
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

const transformToolMessageForAnthropic = (msg: Message): AnthropicMessage => {
  return {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: msg.tool_call_id,
        content: msg.content as string,
      },
    ],
  };
};

export const BedrockAnthropicChatCompleteConfig: ProviderConfig = {
  messages: [
    {
      param: "messages",
      required: true,
      transform: (params: Params) => {
        let messages: AnthropicMessage[] = [];
        // Transform the chat messages into a simple prompt
        if (!!params.messages) {
          params.messages.forEach((msg) => {
            if (msg.role === "system") return;

            if (msg.role === "assistant") {
              messages.push(transformAssistantMessageForAnthropic(msg));
            } else if (
              msg.content &&
              typeof msg.content === "object" &&
              msg.content.length
            ) {
              const transformedMessage: Record<string, any> = {
                role: msg.role,
                content: [],
              };
              msg.content.forEach((item) => {
                if (item.type === "text") {
                  transformedMessage.content.push({
                    type: item.type,
                    text: item.text,
                  });
                } else if (
                  item.type === "image_url" &&
                  item.image_url &&
                  item.image_url.url
                ) {
                  const parts = item.image_url.url.split(";");
                  if (parts.length === 2) {
                    const base64ImageParts = parts[1].split(",");
                    const base64Image = base64ImageParts[1];
                    const mediaTypeParts = parts[0].split(":");
                    if (mediaTypeParts.length === 2 && base64Image) {
                      const mediaType = mediaTypeParts[1];
                      transformedMessage.content.push({
                        type: "image",
                        source: {
                          type: "base64",
                          media_type: mediaType,
                          data: base64Image,
                        },
                      });
                    }
                  }
                }
              });
              messages.push(transformedMessage as Message);
            } else if (msg.role === "tool") {
              // even though anthropic supports images in tool results, openai doesn't support it yet
              messages.push(transformToolMessageForAnthropic(msg));
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
      param: "system",
      required: false,
      transform: (params: Params) => {
        let systemMessage: string = "";
        // Transform the chat messages into a simple prompt
        if (!!params.messages) {
          params.messages.forEach((msg) => {
            if (
              msg.role === "system" &&
              msg.content &&
              typeof msg.content === "object" &&
              msg.content[0].text
            ) {
              systemMessage = msg.content[0].text;
            } else if (
              msg.role === "system" &&
              typeof msg.content === "string"
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
    param: "tools",
    required: false,
    transform: (params: Params) => {
      let tools: AnthropicTool[] = [];
      if (params.tools) {
        params.tools.forEach((tool) => {
          if (tool.function) {
            tools.push({
              name: tool.function.name,
              description: tool.function?.description || "",
              input_schema: {
                type: tool.function.parameters?.type || "object",
                properties: tool.function.parameters?.properties || {},
                required: tool.function.parameters?.required || [],
              },
            });
          }
        });
      }
      return tools;
    },
  },
  // None is not supported by Anthropic, defaults to auto
  tool_choice: {
    param: "tool_choice",
    required: false,
    transform: (params: Params) => {
      if (params.tool_choice) {
        if (typeof params.tool_choice === "string") {
          if (params.tool_choice === "required") return { type: "any" };
          else if (params.tool_choice === "auto") return { type: "auto" };
        } else if (typeof params.tool_choice === "object") {
          return { type: "tool", name: params.tool_choice.function.name };
        }
      }
      return null;
    },
  },
  max_tokens: {
    param: "max_tokens",
    required: true,
  },
  temperature: {
    param: "temperature",
    default: 1,
    min: 0,
    max: 1,
  },
  top_p: {
    param: "top_p",
    default: -1,
    min: -1,
  },
  top_k: {
    param: "top_k",
    default: -1,
  },
  stop: {
    param: "stop_sequences",
    transform: (params: Params) => {
      if (params.stop === null) {
        return [];
      }
      return params.stop;
    },
  },
  user: {
    param: "metadata.user_id",
  },
  anthropic_version: {
    param: "anthropic_version",
    required: true,
    default: "bedrock-2023-05-31",
  },
};

export const BedrockCohereChatCompleteConfig: ProviderConfig = {
  messages: {
    param: "prompt",
    required: true,
    transform: (params: Params) => {
      let prompt: string = "";
      if (!!params.messages) {
        let messages: Message[] = params.messages;
        messages.forEach((msg, index) => {
          if (index === 0 && msg.role === "system") {
            prompt += `system: ${messages}\n`;
          } else if (msg.role == "user") {
            prompt += `user: ${msg.content}\n`;
          } else if (msg.role == "assistant") {
            prompt += `assistant: ${msg.content}\n`;
          } else {
            prompt += `${msg.role}: ${msg.content}\n`;
          }
        });
        prompt += "Assistant:";
      }
      return prompt;
    },
  },
  max_tokens: {
    param: "max_tokens",
    default: 20,
    min: 1,
  },
  temperature: {
    param: "temperature",
    default: 0.75,
    min: 0,
    max: 5,
  },
  top_p: {
    param: "p",
    default: 0.75,
    min: 0,
    max: 1,
  },
  top_k: {
    param: "k",
    default: 0,
    max: 500,
  },
  frequency_penalty: {
    param: "frequency_penalty",
    default: 0,
    min: 0,
    max: 1,
  },
  presence_penalty: {
    param: "presence_penalty",
    default: 0,
    min: 0,
    max: 1,
  },
  logit_bias: {
    param: "logit_bias",
  },
  n: {
    param: "num_generations",
    default: 1,
    min: 1,
    max: 5,
  },
  stop: {
    param: "end_sequences",
  },
  stream: {
    param: "stream",
  },
};

export const BedrockLLamaChatCompleteConfig: ProviderConfig = {
  messages: {
    param: "prompt",
    required: true,
    transform: (params: Params) => {
      let prompt: string = "";
      if (!!params.messages) {
        let messages: Message[] = params.messages;
        messages.forEach((msg, index) => {
          if (index === 0 && msg.role === "system") {
            prompt += `system: ${messages}\n`;
          } else if (msg.role == "user") {
            prompt += `user: ${msg.content}\n`;
          } else if (msg.role == "assistant") {
            prompt += `assistant: ${msg.content}\n`;
          } else {
            prompt += `${msg.role}: ${msg.content}\n`;
          }
        });
        prompt += "Assistant:";
      }
      return prompt;
    },
  },
  max_tokens: {
    param: "max_gen_len",
    default: 512,
    min: 1,
    max: 2048,
  },
  temperature: {
    param: "temperature",
    default: 0.5,
    min: 0,
    max: 1,
  },
  top_p: {
    param: "top_p",
    default: 0.9,
    min: 0,
    max: 1,
  },
};

export const BedrockMistralChatCompleteConfig: ProviderConfig = {
  messages: {
    param: "prompt",
    required: true,
    transform: (params: Params) => {
      let prompt: string = "";
      if (!!params.messages) {
        let messages: Message[] = params.messages;
        messages.forEach((msg, index) => {
          if (index === 0 && msg.role === "system") {
            prompt += `system: ${messages}\n`;
          } else if (msg.role == "user") {
            prompt += `user: ${msg.content}\n`;
          } else if (msg.role == "assistant") {
            prompt += `assistant: ${msg.content}\n`;
          } else {
            prompt += `${msg.role}: ${msg.content}\n`;
          }
        });
        prompt += "Assistant:";
      }
      return prompt;
    },
  },
  max_tokens: {
    param: "max_tokens",
    default: 20,
    min: 1,
  },
  temperature: {
    param: "temperature",
    default: 0.75,
    min: 0,
    max: 5,
  },
  top_p: {
    param: "top_p",
    default: 0.75,
    min: 0,
    max: 1,
  },
  top_k: {
    param: "top_k",
    default: 0,
    max: 200,
  },
  stop: {
    param: "stop",
  },
};

const transformTitanGenerationConfig = (params: Params) => {
  const generationConfig: Record<string, any> = {};
  if (params["temperature"]) {
    generationConfig["temperature"] = params["temperature"];
  }
  if (params["top_p"]) {
    generationConfig["topP"] = params["top_p"];
  }
  if (params["max_tokens"]) {
    generationConfig["maxTokenCount"] = params["max_tokens"];
  }
  if (params["stop"]) {
    generationConfig["stopSequences"] = params["stop"];
  }
  return generationConfig;
};

export const BedrockTitanChatompleteConfig: ProviderConfig = {
  messages: {
    param: "inputText",
    required: true,
    transform: (params: Params) => {
      let prompt: string = "";
      if (!!params.messages) {
        let messages: Message[] = params.messages;
        messages.forEach((msg, index) => {
          if (index === 0 && msg.role === "system") {
            prompt += `system: ${messages}\n`;
          } else if (msg.role == "user") {
            prompt += `user: ${msg.content}\n`;
          } else if (msg.role == "assistant") {
            prompt += `assistant: ${msg.content}\n`;
          } else {
            prompt += `${msg.role}: ${msg.content}\n`;
          }
        });
        prompt += "Assistant:";
      }
      return prompt;
    },
  },
  temperature: {
    param: "textGenerationConfig",
    transform: (params: Params) => transformTitanGenerationConfig(params),
  },
  max_tokens: {
    param: "textGenerationConfig",
    transform: (params: Params) => transformTitanGenerationConfig(params),
  },
  top_p: {
    param: "textGenerationConfig",
    transform: (params: Params) => transformTitanGenerationConfig(params),
  },
};

export const BedrockAI21ChatCompleteConfig: ProviderConfig = {
  messages: {
    param: "prompt",
    required: true,
    transform: (params: Params) => {
      let prompt: string = "";
      if (!!params.messages) {
        let messages: Message[] = params.messages;
        messages.forEach((msg, index) => {
          if (index === 0 && msg.role === "system") {
            prompt += `system: ${messages}\n`;
          } else if (msg.role == "user") {
            prompt += `user: ${msg.content}\n`;
          } else if (msg.role == "assistant") {
            prompt += `assistant: ${msg.content}\n`;
          } else {
            prompt += `${msg.role}: ${msg.content}\n`;
          }
        });
        prompt += "Assistant:";
      }
      return prompt;
    },
  },
  max_tokens: {
    param: "maxTokens",
    default: 200,
  },
  temperature: {
    param: "temperature",
    default: 0.7,
    min: 0,
    max: 1,
  },
  top_p: {
    param: "topP",
    default: 1,
  },
  stop: {
    param: "stopSequences",
  },
  presence_penalty: {
    param: "presencePenalty",
    transform: (params: Params) => {
      return {
        scale: params.presence_penalty,
      };
    },
  },
  frequency_penalty: {
    param: "frequencyPenalty",
    transform: (params: Params) => {
      return {
        scale: params.frequency_penalty,
      };
    },
  },
  countPenalty: {
    param: "countPenalty",
  },
  frequencyPenalty: {
    param: "frequencyPenalty",
  },
  presencePenalty: {
    param: "presencePenalty",
  },
};

export const BedrockErrorResponseTransform: (
  response: BedrockErrorResponse,
) => ErrorResponse | undefined = (response) => {
  if ("message" in response) {
    return generateErrorResponse(
      { message: response.message, type: null, param: null, code: null },
      BEDROCK,
    );
  }

  return undefined;
};

export const BedrockLlamaChatCompleteResponseTransform: (
  response: BedrockLlamaCompleteResponse | BedrockErrorResponse,
  responseStatus: number,
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse,
    );
    if (errorResposne) return errorResposne;
  }

  if ("generation" in response) {
    return {
      id: Date.now().toString(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: BEDROCK,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: response.generation,
          },
          finish_reason: response.stop_reason,
        },
      ],
      usage: {
        prompt_tokens: response.prompt_token_count,
        completion_tokens: response.generation_token_count,
        total_tokens:
          response.prompt_token_count + response.generation_token_count,
      },
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};

export const BedrockLlamaChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string,
) => string | string[] = (responseChunk, fallbackId) => {
  let chunk = responseChunk.trim();
  chunk = chunk.trim();
  const parsedChunk: BedrockLlamaStreamChunk = JSON.parse(chunk);

  if (parsedChunk.stop_reason) {
    return [
      `data: ${JSON.stringify({
        id: fallbackId,
        object: "text_completion",
        created: Math.floor(Date.now() / 1000),
        model: "",
        provider: BEDROCK,
        choices: [
          {
            delta: {},
            index: 0,
            logprobs: null,
            finish_reason: parsedChunk.stop_reason,
          },
        ],
        usage: {
          prompt_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount,
          completion_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
          total_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount +
            parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
        },
      })}\n\n`,
      `data: [DONE]\n\n`,
    ];
  }

  return `data: ${JSON.stringify({
    id: fallbackId,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "",
    provider: BEDROCK,
    choices: [
      {
        index: 0,
        delta: {
          role: "assistant",
          content: parsedChunk.generation,
        },
        finish_reason: null,
      },
    ],
  })}\n\n`;
};

export const BedrockTitanChatCompleteResponseTransform: (
  response: BedrockTitanCompleteResponse | BedrockErrorResponse,
  responseStatus: number,
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse,
    );
    if (errorResposne) return errorResposne;
  }

  if ("results" in response) {
    const completionTokens = response.results
      .map((r) => r.tokenCount)
      .reduce((partialSum, a) => partialSum + a, 0);
    return {
      id: Date.now().toString(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: BEDROCK,
      choices: response.results.map((generation, index) => ({
        index: index,
        message: {
          role: "assistant",
          content: generation.outputText,
        },
        finish_reason: generation.completionReason,
      })),
      usage: {
        prompt_tokens: response.inputTextTokenCount,
        completion_tokens: completionTokens,
        total_tokens: response.inputTextTokenCount + completionTokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};

export const BedrockTitanChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string,
) => string | string[] = (responseChunk, fallbackId) => {
  let chunk = responseChunk.trim();
  chunk = chunk.trim();
  const parsedChunk: BedrockTitanStreamChunk = JSON.parse(chunk);

  return [
    `data: ${JSON.stringify({
      id: fallbackId,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: BEDROCK,
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: parsedChunk.outputText,
          },
          finish_reason: null,
        },
      ],
    })}\n\n`,
    `data: ${JSON.stringify({
      id: fallbackId,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: BEDROCK,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: parsedChunk.completionReason,
        },
      ],
      usage: {
        prompt_tokens:
          parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount,
        completion_tokens:
          parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
        total_tokens:
          parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount +
          parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
      },
    })}\n\n`,
    `data: [DONE]\n\n`,
  ];
};

export const BedrockAI21ChatCompleteResponseTransform: (
  response: BedrockAI21CompleteResponse | BedrockErrorResponse,
  responseStatus: number,
  responseHeaders: Headers,
) => ChatCompletionResponse | ErrorResponse = (
  response,
  responseStatus,
  responseHeaders,
) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse,
    );
    if (errorResposne) return errorResposne;
  }

  if ("completions" in response) {
    const prompt_tokens =
      Number(responseHeaders.get("X-Amzn-Bedrock-Input-Token-Count")) || 0;
    const completion_tokens =
      Number(responseHeaders.get("X-Amzn-Bedrock-Output-Token-Count")) || 0;
    return {
      id: response.id.toString(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: BEDROCK,
      choices: response.completions.map((completion, index) => ({
        index: index,
        message: {
          role: "assistant",
          content: completion.data.text,
        },
        finish_reason: completion.finishReason?.reason,
      })),
      usage: {
        prompt_tokens: prompt_tokens,
        completion_tokens: completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};

interface BedrockAnthropicChatCompleteResponse {
  id: string;
  type: string;
  role: string;
  content: AnthropicContentItem[];
  stop_reason: string;
  model: string;
  stop_sequence: null | string;
}

export const BedrockAnthropicChatCompleteResponseTransform: (
  response: BedrockAnthropicChatCompleteResponse | BedrockErrorResponse,
  responseStatus: number,
  responseHeaders: Headers,
) => ChatCompletionResponse | ErrorResponse = (
  response,
  responseStatus,
  responseHeaders,
) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse,
    );
    if (errorResposne) return errorResposne;
  }

  if ("content" in response) {
    const prompt_tokens =
      Number(responseHeaders.get("X-Amzn-Bedrock-Input-Token-Count")) || 0;
    const completion_tokens =
      Number(responseHeaders.get("X-Amzn-Bedrock-Output-Token-Count")) || 0;

    let content = "";
    if (response.content.length && response.content[0].type === "text") {
      content = response.content[0].text;
    }

    let toolCalls: any = [];
    response.content.forEach((item) => {
      if (item.type === "tool_use") {
        toolCalls.push({
          id: item.id,
          type: "function",
          function: {
            name: item.name,
            arguments: JSON.stringify(item.input),
          },
        });
      }
    });

    return {
      id: response.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      provider: BEDROCK,
      choices: [
        {
          message: {
            role: "assistant",
            content,
            tool_calls: toolCalls.length ? toolCalls : undefined,
          },
          index: 0,
          logprobs: null,
          finish_reason: response.stop_reason,
        },
      ],
      usage: {
        prompt_tokens: prompt_tokens,
        completion_tokens: completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};

interface BedrockAnthropicChatCompleteStreamResponse {
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
  "amazon-bedrock-invocationMetrics": {
    inputTokenCount: number;
    outputTokenCount: number;
    invocationLatency: number;
    firstByteLatency: number;
  };
}

export const BedrockAnthropicChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string,
  streamState: Record<string, boolean>,
) => string | string[] | undefined = (
  responseChunk,
  fallbackId,
  streamState,
) => {
  let chunk = responseChunk.trim();

  const parsedChunk: BedrockAnthropicChatCompleteStreamResponse =
    JSON.parse(chunk);
  if (
    parsedChunk.type === "ping" ||
    parsedChunk.type === "message_start" ||
    parsedChunk.type === "content_block_stop"
  ) {
    return [];
  }

  if (
    parsedChunk.type === "content_block_start" &&
    parsedChunk.content_block?.type === "text"
  ) {
    streamState.containsChainOfThoughtMessage = true;
    return;
  }

  if (parsedChunk.type === "message_stop") {
    return [
      `data: ${JSON.stringify({
        id: fallbackId,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "",
        provider: BEDROCK,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: parsedChunk.delta?.stop_reason,
          },
        ],
        usage: {
          prompt_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount,
          completion_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
          total_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount +
            parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
        },
      })}\n\n`,
      "data: [DONE]\n\n",
    ];
  }

  if (parsedChunk.delta?.stop_reason) {
    return [
      `data: ${JSON.stringify({
        id: fallbackId,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "",
        provider: BEDROCK,
        choices: [
          {
            delta: {
              content: parsedChunk.delta?.text,
            },
            index: 0,
            logprobs: null,
            finish_reason: parsedChunk.delta?.stop_reason ?? null,
          },
        ],
      })}\n\n`,
    ];
  }

  const toolCalls = [];
  const isToolBlockStart: boolean =
    parsedChunk.type === "content_block_start" &&
    !!parsedChunk.content_block?.id;
  const isToolBlockDelta: boolean =
    parsedChunk.type === "content_block_delta" &&
    !!parsedChunk.delta.partial_json;
  const toolIndex: number = streamState.containsChainOfThoughtMessage
    ? parsedChunk.index - 1
    : parsedChunk.index;

  if (isToolBlockStart && parsedChunk.content_block) {
    toolCalls.push({
      index: toolIndex,
      id: parsedChunk.content_block.id,
      type: "function",
      function: {
        name: parsedChunk.content_block.name,
        arguments: "",
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

  return `data: ${JSON.stringify({
    id: fallbackId,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "",
    provider: BEDROCK,
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
  })}\n\n`;
};

export const BedrockCohereChatCompleteResponseTransform: (
  response: BedrockCohereCompleteResponse | BedrockErrorResponse,
  responseStatus: number,
  responseHeaders: Headers,
) => ChatCompletionResponse | ErrorResponse = (
  response,
  responseStatus,
  responseHeaders,
) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse,
    );
    if (errorResposne) return errorResposne;
  }

  if ("generations" in response) {
    const prompt_tokens =
      Number(responseHeaders.get("X-Amzn-Bedrock-Input-Token-Count")) || 0;
    const completion_tokens =
      Number(responseHeaders.get("X-Amzn-Bedrock-Output-Token-Count")) || 0;
    return {
      id: Date.now().toString(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: BEDROCK,
      choices: response.generations.map((generation, index) => ({
        index: index,
        message: {
          role: "assistant",
          content: generation.text,
        },
        finish_reason: generation.finish_reason,
      })),
      usage: {
        prompt_tokens: prompt_tokens,
        completion_tokens: completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};

export const BedrockCohereChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string,
) => string | string[] = (responseChunk, fallbackId) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, "");
  chunk = chunk.trim();
  const parsedChunk: BedrockCohereStreamChunk = JSON.parse(chunk);

  // discard the last cohere chunk as it sends the whole response combined.
  if (parsedChunk.is_finished) {
    return [
      `data: ${JSON.stringify({
        id: fallbackId,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "",
        provider: BEDROCK,
        choices: [
          {
            index: parsedChunk.index ?? 0,
            delta: {},
            finish_reason: parsedChunk.finish_reason,
          },
        ],
        usage: {
          prompt_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount,
          completion_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
          total_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount +
            parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
        },
      })}\n\n`,
      `data: [DONE]\n\n`,
    ];
  }

  return `data: ${JSON.stringify({
    id: fallbackId,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "",
    provider: BEDROCK,
    choices: [
      {
        index: parsedChunk.index ?? 0,
        delta: {
          role: "assistant",
          content: parsedChunk.text,
        },
        finish_reason: null,
      },
    ],
  })}\n\n`;
};

export const BedrockMistralChatCompleteResponseTransform: (
  response: BedrockMistralCompleteResponse | BedrockErrorResponse,
  responseStatus: number,
  responseHeaders: Headers,
) => ChatCompletionResponse | ErrorResponse = (
  response,
  responseStatus,
  responseHeaders,
) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse,
    );
    if (errorResposne) return errorResposne;
  }

  if ("outputs" in response) {
    const prompt_tokens =
      Number(responseHeaders.get("X-Amzn-Bedrock-Input-Token-Count")) || 0;
    const completion_tokens =
      Number(responseHeaders.get("X-Amzn-Bedrock-Output-Token-Count")) || 0;
    return {
      id: Date.now().toString(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: BEDROCK,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: response.outputs[0].text,
          },
          finish_reason: response.outputs[0].stop_reason,
        },
      ],
      usage: {
        prompt_tokens: prompt_tokens,
        completion_tokens: completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};

export const BedrockMistralChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string,
) => string | string[] = (responseChunk, fallbackId) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, "");
  chunk = chunk.trim();
  const parsedChunk: BedrocMistralStreamChunk = JSON.parse(chunk);

  // discard the last cohere chunk as it sends the whole response combined.
  if (parsedChunk.outputs[0].stop_reason) {
    return [
      `data: ${JSON.stringify({
        id: fallbackId,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "",
        provider: BEDROCK,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: parsedChunk.outputs[0].stop_reason,
          },
        ],
        usage: {
          prompt_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount,
          completion_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
          total_tokens:
            parsedChunk["amazon-bedrock-invocationMetrics"].inputTokenCount +
            parsedChunk["amazon-bedrock-invocationMetrics"].outputTokenCount,
        },
      })}\n\n`,
      `data: [DONE]\n\n`,
    ];
  }

  return `data: ${JSON.stringify({
    id: fallbackId,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "",
    provider: BEDROCK,
    choices: [
      {
        index: 0,
        delta: {
          role: "assistant",
          content: parsedChunk.outputs[0].text,
        },
        finish_reason: null,
      },
    ],
  })}\n\n`;
};
