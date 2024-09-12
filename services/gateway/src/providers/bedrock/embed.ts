import { BEDROCK } from '../../globals';
import { EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import { generateInvalidProviderResponseError } from '../utils';
import { BedrockErrorResponseTransform } from './chatComplete';

export const BedrockCohereEmbedConfig: ProviderConfig = {
  input: {
    param: 'texts',
    required: true,
    transform: (params: any): string[] => {
      if (Array.isArray(params.input)) {
        return params.input;
      } else {
        return [params.input];
      }
    },
  },
  input_type: {
    param: 'input_type',
    required: true,
  },
  truncate: {
    param: 'truncate',
  },
};

export const BedrockTitanEmbedConfig: ProviderConfig = {
  input: {
    param: 'inputText',
    required: true,
  },
};

interface BedrockTitanEmbedResponse {
  embedding: number[];
  inputTextTokenCount: number;
}

export interface BedrockErrorResponse {
  message: string;
}

export const BedrockTitanEmbedResponseTransform: (
  response: BedrockTitanEmbedResponse | BedrockErrorResponse,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse
    );
    if (errorResposne) return errorResposne;
  }

  if ('embedding' in response) {
    return {
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: response.embedding,
          index: 0,
        },
      ],
      provider: BEDROCK,
      model: '',
      usage: {
        prompt_tokens: response.inputTextTokenCount,
        total_tokens: response.inputTextTokenCount,
      },
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};

interface BedrockCohereEmbedResponse {
  embeddings: number[][];
  id: string;
  texts: string[];
}

export const BedrockCohereEmbedResponseTransform: (
  response: BedrockCohereEmbedResponse | BedrockErrorResponse,
  responseStatus: number,
  responseHeaders: Headers
) => EmbedResponse | ErrorResponse = (
  response,
  responseStatus,
  responseHeaders
) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse
    );
    if (errorResposne) return errorResposne;
  }

  if ('embeddings' in response) {
    return {
      object: 'list',
      data: response.embeddings.map((embedding, index) => ({
        object: 'embedding',
        embedding: embedding,
        index: index,
      })),
      provider: BEDROCK,
      model: '',
      usage: {
        prompt_tokens:
          Number(responseHeaders.get('X-Amzn-Bedrock-Input-Token-Count')) || -1,
        total_tokens:
          Number(responseHeaders.get('X-Amzn-Bedrock-Input-Token-Count')) || -1,
      },
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};
