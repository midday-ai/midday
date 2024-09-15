import { COHERE } from "../../globals";
import { Message, Params } from "../../types/requestBody";
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from "../types";
import { generateErrorResponse } from "../utils";

// TODOS: this configuration does not enforce the maximum token limit for the input parameter. If you want to enforce this, you might need to add a custom validation function or a max property to the ParameterConfig interface, and then use it in the input configuration. However, this might be complex because the token count is not a simple length check, but depends on the specific tokenization method used by the model.

export const CohereChatCompleteConfig: ProviderConfig = {
  model: {
    param: "model",
    default: "command",
    required: true,
  },
  messages: [
    {
      param: "message",
      required: true,
      transform: (params: Params) => {
        const messages = params.messages || [];
        const prompt = messages.at(-1);
        if (!prompt) {
          throw new Error("messages length should be at least of length 1");
        }

        if (typeof prompt.content === "string") {
          return prompt.content;
        }

        return prompt.content
          ?.filter((_msg) => _msg.type === "text")
          .reduce((acc, _msg) => acc + _msg.text, "");
      },
    },
    {
      param: "chat_history",
      required: false,
      transform: (params: Params) => {
        const messages = params.messages || [];
        const messagesWithoutLastMessage = messages.slice(
          0,
          messages.length - 1,
        );
        // generate history and forward it to model
        const history: { message?: string; role: string }[] =
          messagesWithoutLastMessage.map((message) => {
            const _message: { role: any; message: string } = {
              role: message.role === "assistant" ? "chatbot" : message.role,
              message: "",
            };

            if (typeof message.content === "string") {
              _message["message"] = message.content;
            } else if (Array.isArray(message.content)) {
              _message["message"] = (message.content ?? [])
                .filter((c) => Boolean(c.text))
                .map((content) => content.text)
                .join("\n");
            }

            return _message;
          });
        return history;
      },
    },
  ],
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
  stop: {
    param: "end_sequences",
  },
  stream: {
    param: "stream",
    default: false,
  },
};

interface CohereCompleteResponse {
  text: string;
  generation_id: string;
  finish_reason:
    | "COMPLETE"
    | "STOP_SEQUENCE"
    | "ERROR"
    | "ERROR_TOXIC"
    | "ERROR_LIMIT"
    | "USER_CANCEL"
    | "MAX_TOKENS";
  meta: {
    api_version: {
      version: string;
    };
    billed_units: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  chat_history?: {
    role: "CHATBOT" | "SYSTEM" | "TOOL" | "USER";
    message: string;
  }[];
  message?: string;
  status?: number;
}

export const CohereChatCompleteResponseTransform: (
  response: CohereCompleteResponse,
  responseStatus: number,
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.message || "",
        type: null,
        param: null,
        code: null,
      },
      COHERE,
    );
  }

  return {
    id: response.generation_id,
    object: "chat_completion",
    created: Math.floor(Date.now() / 1000),
    model: "Unknown",
    provider: COHERE,
    choices: [
      {
        message: { role: "assistant", content: response.text },
        index: 0,
        finish_reason: response.finish_reason,
      },
    ],
    usage: {
      completion_tokens: response.meta.billed_units.output_tokens,
      prompt_tokens: response.meta.billed_units.input_tokens,
      total_tokens: Number(
        response.meta.billed_units.output_tokens +
          response.meta.billed_units.input_tokens,
      ),
    },
  };
};

export type CohereStreamChunk =
  | { event_type: "stream-start"; generation_id: string }
  | { event_type: "text-generation"; text: string }
  | {
      event_type: "stream-end";
      response_id: string;
      response: {
        finish_reason: CohereCompleteResponse["finish_reason"];
        meta: CohereCompleteResponse["meta"];
      };
    };

export const CohereChatCompleteStreamChunkTransform: (
  response: string,
  fallbackId: string,
  streamState: CohereStreamState,
) => string = (
  responseChunk,
  fallbackId,
  streamState = { generation_id: "" },
) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, "");
  chunk = chunk.trim();
  const parsedChunk: CohereStreamChunk = JSON.parse(chunk);
  if (parsedChunk.event_type === "stream-start") {
    streamState.generation_id = parsedChunk.generation_id;
  }

  return (
    `data: ${JSON.stringify({
      id: streamState?.generation_id ?? fallbackId,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "",
      provider: COHERE,
      ...(parsedChunk.event_type === "stream-end" && {
        usage: {
          completion_tokens:
            parsedChunk.response.meta.billed_units.output_tokens,
          prompt_tokens: parsedChunk.response.meta.billed_units.input_tokens,
          total_tokens: Number(
            parsedChunk.response.meta.billed_units.output_tokens +
              parsedChunk.response.meta.billed_units.input_tokens,
          ),
        },
      }),
      choices: [
        {
          index: 0,
          delta: {
            content: (parsedChunk as any)?.text ?? "",
            role: "assistant",
          },
          logprobs: null,
          finish_reason: (parsedChunk as any).finish_reason ?? null,
        },
      ],
    })}` + "\n\n"
  );
};
