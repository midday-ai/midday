import { ProviderConfigs } from '../types';
import SegmindAPIConfig from './api';
import {
  SegmindImageGenerateConfig,
  SegmindImageGenerateResponseTransform,
} from './imageGenerate';

const SegmindConfig: ProviderConfigs = {
  api: SegmindAPIConfig,
  imageGenerate: SegmindImageGenerateConfig,
  responseTransforms: {
    imageGenerate: SegmindImageGenerateResponseTransform,
  },
};

export default SegmindConfig;
