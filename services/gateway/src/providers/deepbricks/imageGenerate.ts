import { DEEPBRICKS } from '../../globals';
import { ErrorResponse, ImageGenerateResponse, ProviderConfig } from '../types';
import { DeepbricksErrorResponseTransform } from './chatComplete';

export const DeepbricksImageGenerateConfig: ProviderConfig = {
  prompt: {
    param: 'prompt',
    required: true,
  },
  model: {
    param: 'model',
    required: true,
    default: 'dall-e-2',
  },
  n: {
    param: 'n',
    min: 1,
    max: 10,
  },
  quality: {
    param: 'quality',
  },
  response_format: {
    param: 'response_format',
  },
  size: {
    param: 'size',
  },
  style: {
    param: 'style',
  },
  user: {
    param: 'user',
  },
};

interface DeepbricksImageObject {
  b64_json?: string; // The base64-encoded JSON of the generated image, if response_format is b64_json.
  url?: string; // The URL of the generated image, if response_format is url (default).
  revised_prompt?: string; // The prompt that was used to generate the image, if there was any revision to the prompt.
}

interface DeepbricksImageGenerateResponse extends ImageGenerateResponse {
  data: DeepbricksImageObject[];
}

export const DeepbricksImageGenerateResponseTransform: (
  response: DeepbricksImageGenerateResponse | ErrorResponse,
  responseStatus: number
) => ImageGenerateResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200 && 'error' in response) {
    return DeepbricksErrorResponseTransform(response, DEEPBRICKS);
  }

  return response;
};
