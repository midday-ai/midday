import { SEGMIND } from '../../globals';
import { ErrorResponse, ImageGenerateResponse, ProviderConfig } from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const SegmindImageGenerateConfig: ProviderConfig = {
  prompt: {
    param: 'prompt',
    required: true,
  },
  n: {
    param: 'samples',
    min: 1,
    max: 10,
    default: 1,
  },
  size: [
    {
      param: 'img_height',
      transform: (params: any) =>
        parseInt(params.size.toLowerCase().split('x')[1]),
    },
    {
      param: 'img_width',
      transform: (params: any) =>
        parseInt(params.size.toLowerCase().split('x')[0]),
    },
  ],
  style: {
    param: 'style',
    default: 'base',
  },
  steps: {
    param: 'num_inference_steps',
    default: 20,
    required: true,
  },
  negative_prompt: {
    param: 'negative_prompt',
    default:
      'out of frame, duplicate, watermark, signature, text, error, deformed',
  },
  scheduler: {
    param: 'scheduler',
    default: 'UniPC',
  },
  guidance_scale: {
    param: 'guidance_scale',
    default: 7.5,
  },
  seed: {
    param: 'seed',
    default: Math.floor(Math.random() * 1000000000),
  },
  strength: {
    param: 'strength',
    default: 0.75,
  },
  refiner: {
    param: 'refiner',
    default: true,
  },
  high_noise_fraction: {
    param: 'high_noise_fraction',
    default: 0.8,
  },
  base64: {
    param: 'base64',
    transform: (params: any) => true, // Always true to handle uniform responses
    default: true,
    required: true,
  },
  control_scale: {
    param: 'control_scale',
    default: 1.8,
  },
  control_start: {
    param: 'control_start',
    default: 0.19,
  },
  control_end: {
    param: 'control_end',
    default: 1,
  },
  qr_text: {
    param: 'qr_text',
    default: 'https://portkey.ai',
  },
  invert: {
    param: 'invert',
    default: false,
  },
  qr_size: {
    param: 'size',
    default: 768,
  },
};

interface SegmindImageGenerateResponse {
  image: string; // Image encoded in base64
  status: string; // Status of the image generation
  interTime: number;
}

interface SegmindImageGenerateErrorResponse {
  'html-message'?: string;
  error?: string;
}

export const SegmindImageGenerateResponseTransform: (
  response: SegmindImageGenerateResponse | SegmindImageGenerateErrorResponse,
  responseStatus: number
) => ImageGenerateResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200 && 'error' in response) {
    return generateErrorResponse(
      { message: response.error ?? '', type: null, param: null, code: null },
      SEGMIND
    );
  }

  if (responseStatus !== 200 && 'html-message' in response) {
    return generateErrorResponse(
      {
        message: response['html-message'] ?? '',
        type: null,
        param: null,
        code: null,
      },
      SEGMIND
    );
  }

  if ('image' in response) {
    // Convert to an image array if needed
    let imageArr = Array.isArray(response.image)
      ? response.image
      : [response.image];

    // Convert to the array object needed in the response
    let dataObj: object[] = imageArr.map((img) => ({ b64_json: img }));

    return {
      created: `${new Date().getTime()}`, // Corrected method call
      data: dataObj,
      provider: SEGMIND,
    } as ImageGenerateResponse;
  }

  return generateInvalidProviderResponseError(response, SEGMIND);
};
