import { BEDROCK } from '../../globals';
import { ErrorResponse, ImageGenerateResponse, ProviderConfig } from '../types';
import { generateInvalidProviderResponseError } from '../utils';
import { BedrockErrorResponseTransform } from './chatComplete';
import { BedrockErrorResponse } from './embed';

export const BedrockStabilityAIImageGenerateConfig: ProviderConfig = {
  prompt: {
    param: 'text_prompts',
    required: true,
    transform: (params: any) => {
      return [
        {
          text: params.prompt,
          weight: 1,
        },
      ];
    },
  },
  n: {
    param: 'samples',
    min: 1,
    max: 10,
  },
  size: [
    {
      param: 'height',
      transform: (params: any) =>
        parseInt(params.size.toLowerCase().split('x')[1]),
      min: 320,
    },
    {
      param: 'width',
      transform: (params: any) =>
        parseInt(params.size.toLowerCase().split('x')[0]),
      min: 320,
    },
  ],
  style: {
    param: 'style_preset',
  },
};

interface ImageArtifact {
  base64: string;
  finishReason: 'CONTENT_FILTERED' | 'ERROR' | 'SUCCESS';
  seed: number;
}

interface BedrockStabilityAIImageGenerateResponse {
  result: string;
  artifacts: ImageArtifact[];
}

export const BedrockStabilityAIImageGenerateResponseTransform: (
  response: BedrockStabilityAIImageGenerateResponse | BedrockErrorResponse,
  responseStatus: number
) => ImageGenerateResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResposne = BedrockErrorResponseTransform(
      response as BedrockErrorResponse
    );
    if (errorResposne) return errorResposne;
  }

  if ('artifacts' in response) {
    return {
      created: `${new Date().getTime()}`,
      data: response.artifacts.map((art) => ({ b64_json: art.base64 })),
      provider: BEDROCK,
    };
  }

  return generateInvalidProviderResponseError(response, BEDROCK);
};
