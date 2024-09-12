import { FIREWORKS_AI } from '../../globals';
import { ErrorResponse, ImageGenerateResponse, ProviderConfig } from '../types';
import { generateInvalidProviderResponseError } from '../utils';
import {
  FireworksAIValidationErrorResponse,
  FireworksAIErrorResponseTransform,
  FireworksAIErrorResponse,
} from './chatComplete';

export const FireworksAIImageGenerateConfig: ProviderConfig = {
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
  model: {
    param: 'model',
    required: true,
    default: 'stable-diffusion-xl-1024-v1-0',
  },
  size: [
    {
      param: 'height',
      transform: (params: any) =>
        parseInt(params.size.toLowerCase().split('x')[1]),
      min: 512,
      max: 1024,
      default: 1024,
    },
    {
      param: 'width',
      transform: (params: any) =>
        parseInt(params.size.toLowerCase().split('x')[0]),
      min: 512,
      max: 1024,
      default: 1024,
    },
  ],
  cfg_scale: {
    param: 'cfg_scale',
    default: 7,
  },
  sampler: {
    param: 'sampler',
  },
  n: {
    param: 'samples',
    min: 1,
    max: 10,
    default: 1,
  },
  seed: {
    param: 'seed',
    min: 0,
    max: 4294967295,
  },
  steps: {
    param: 'steps',
    min: 10,
    max: 150,
    default: 50,
  },
  safety_check: {
    param: 'safety_check',
  },
  lora_adapter_name: {
    param: 'lora_adapter_name',
  },
  lora_weight_filename: {
    param: 'lora_weight_filename',
  },
};

interface FireworksAIImageObject {
  base64: string; // The base64-encoded JSON of the generated image, if response_format is b64_json.
  finishReason: string;
  seed: number;
  Id: string;
  ['X-Fireworks-Billing-Idempotency-Id']: string;
}

export const FireworksAIImageGenerateResponseTransform: (
  response:
    | FireworksAIImageObject[]
    | FireworksAIValidationErrorResponse
    | FireworksAIErrorResponse,
  responseStatus: number
) => ImageGenerateResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus != 200) {
    return FireworksAIErrorResponseTransform(
      response as FireworksAIValidationErrorResponse | FireworksAIErrorResponse
    );
  }
  if (response instanceof Array) {
    return {
      created: `${new Date().getTime()}`, // Corrected method call
      data: response?.map((r) => ({
        b64_json: r.base64,
        seed: r.seed,
        finishReason: r.finishReason,
      })), // Corrected object creation within map
      provider: FIREWORKS_AI,
    };
  }

  return generateInvalidProviderResponseError(response, FIREWORKS_AI);
};
