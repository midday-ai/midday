import { ProviderConfigs } from '../types';
import {
  HuggingfaceCompleteConfig,
  HuggingfaceCompleteResponseTransform,
  HuggingfaceCompleteStreamChunkTransform,
} from './complete';
import HuggingfaceAPIConfig from './api';
import {
  HuggingfaceChatCompleteConfig,
  HuggingfaceChatCompleteResponseTransform,
  HuggingfaceChatCompleteStreamChunkTransform,
} from './chatComplete';

const HuggingfaceConfig: ProviderConfigs = {
  complete: HuggingfaceCompleteConfig,
  api: HuggingfaceAPIConfig,
  chatComplete: HuggingfaceChatCompleteConfig,
  responseTransforms: {
    complete: HuggingfaceCompleteResponseTransform,
    'stream-complete': HuggingfaceCompleteStreamChunkTransform,
    chatComplete: HuggingfaceChatCompleteResponseTransform,
    'stream-chatComplete': HuggingfaceChatCompleteStreamChunkTransform,
  },
};

export default HuggingfaceConfig;
