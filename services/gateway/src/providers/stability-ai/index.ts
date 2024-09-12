import { ProviderConfigs } from '../types';
import StabilityAIAPIConfig from './api';
import {
  StabilityAIImageGenerateConfig,
  StabilityAIImageGenerateResponseTransform,
} from './imageGenerate';

const StabilityAIConfig: ProviderConfigs = {
  api: StabilityAIAPIConfig,
  imageGenerate: StabilityAIImageGenerateConfig,
  responseTransforms: {
    imageGenerate: StabilityAIImageGenerateResponseTransform,
  },
};

export default StabilityAIConfig;
