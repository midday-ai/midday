import { JINA } from '../../globals';
import { EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const JinaEmbedConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: 'jina-embeddings-v2-base-en',
  },
  input: {
    param: 'input',
    default: '',
  },
  encoding_format: {
    param: 'encoding_format',
  },
};

interface JinaEmbedResponse extends EmbedResponse {}

interface JinaErrorResponse {
  detail: string;
}

export const JinaEmbedResponseTransform: (
  response: JinaEmbedResponse | JinaErrorResponse,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200 && 'detail' in response) {
    return generateErrorResponse(
      {
        message: response.detail,
        type: null,
        param: null,
        code: null,
      },
      JINA
    );
  }

  if ('data' in response) {
    return {
      object: response.object,
      data: response.data.map((d) => ({
        object: d.object,
        index: d.index,
        embedding: d.embedding,
      })),
      provider: JINA,
      model: response.model,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        total_tokens: response.usage?.total_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, JINA);
};
