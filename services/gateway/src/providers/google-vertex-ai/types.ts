import { ChatCompletionResponse } from '../types';

export interface GoogleErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
    details: Array<Record<string, any>>;
  };
}

export interface GoogleGenerateFunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface GoogleGenerateContentResponse {
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
      probabilityScore: number;
      severity: string;
      severityScore: number;
    }[];
  };
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface VertexLLamaChatCompleteResponse
  extends Omit<ChatCompletionResponse, 'id' | 'created'> {}

export interface VertexLlamaChatCompleteStreamChunk {
  choices: {
    delta: {
      content: string;
      role: string;
    };
    finish_reason?: string;
    index: 0;
  }[];
  model: string;
  object: string;
  usage?: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
  id?: string;
  created?: number;
  provider?: string;
}
