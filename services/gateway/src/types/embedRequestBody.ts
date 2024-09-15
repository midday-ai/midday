import { BaseResponse } from "../providers/types";
import { Options } from "./requestBody";

export interface EmbedParams {
  model: string; // The model name to be used as the embedding model
  input: string | string[]; // The text or texts to be embedded
  user: string; // An identifier for the user making the request
}

export interface EmbedRequestBody {
  config: {
    provider?: string; // The provider of the AI model, e.g., "anthropic", "cohere", "openai"
    apiKeyName?: string; // The API key name of the provider
    apiKey?: string; // The API key of the provider
    mode?: string;
    options?: Options[];
  };
  params: EmbedParams;
}

export interface EmbedResponseData {
  object: string; // The type of data object, e.g., "embedding"
  embedding: number[] | number[][]; // The embedding vector(s)
  index: number; // The index of the data object
}

export interface EmbedResponse extends BaseResponse {
  object: string; // The type of object returned, e.g., "list"
  data: EmbedResponseData[]; // The list of data objects
  model: string; // The model used to generate the embedding
  usage: {
    prompt_tokens: number; // The number of tokens in the prompt
    total_tokens: number; // The total number of tokens used
  };
}
