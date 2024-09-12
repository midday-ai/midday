import { ProviderConfigs } from '../types';
import DeepbricksAPIConfig from './api';
import {
  DeepbricksChatCompleteConfig,
  DeepbricksChatCompleteResponseTransform,
} from './chatComplete';
import {
  DeepbricksImageGenerateConfig,
  DeepbricksImageGenerateResponseTransform,
} from './imageGenerate';

const DeepbricksConfig: ProviderConfigs = {
  api: DeepbricksAPIConfig,
  chatComplete: DeepbricksChatCompleteConfig,
  imageGenerate: DeepbricksImageGenerateConfig,
  responseTransforms: {
    chatComplete: DeepbricksChatCompleteResponseTransform,
    imageGenerate: DeepbricksImageGenerateResponseTransform,
  },
};

export default DeepbricksConfig;
