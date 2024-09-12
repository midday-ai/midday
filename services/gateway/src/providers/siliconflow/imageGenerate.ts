import { SILICONFLOW } from '../../globals';
import { ErrorResponse, ImageGenerateResponse, ProviderConfig } from '../types';
import { SiliconFlowErrorResponseTransform } from './chatComplete';

export const SiliconFlowImageGenerateConfig: ProviderConfig = {
  prompt: {
    param: 'prompt',
    required: true,
  },
  size: {
    param: 'image_size',
    default: '',
  },
  num_inference_steps: {
    param: 'num_inference_steps',
    default: 20,
  },
  batch_size: {
    param: 'batch_size',
    default: 1,
  },
  guidance_scale: {
    param: 'guidance_scale',
    default: 7.5,
  },
};

interface SiliconFlowImageObject {
  b64_json?: string; // The base64-encoded JSON of the generated image, if response_format is b64_json.
  url?: string; // The URL of the generated image, if response_format is url (default).
  revised_prompt?: string; // The prompt that was used to generate the image, if there was any revision to the prompt.
}

interface SiliconFlowImageGenerateResponse extends ImageGenerateResponse {
  data: SiliconFlowImageObject[];
}

export const SiliconFlowImageGenerateResponseTransform: (
  response: SiliconFlowImageGenerateResponse | ErrorResponse,
  responseStatus: number
) => ImageGenerateResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200 && 'error' in response) {
    return SiliconFlowErrorResponseTransform(response, SILICONFLOW);
  }

  return response;
};
