import { ProviderConfigs } from '../types';
import DeepSeekAPIConfig from './api';
import {
  DeepSeekChatCompleteConfig,
  DeepSeekChatCompleteResponseTransform,
  DeepSeekChatCompleteStreamChunkTransform,
} from './chatComplete';

const DeepSeekConfig: ProviderConfigs = {
  chatComplete: DeepSeekChatCompleteConfig,
  api: DeepSeekAPIConfig,
  responseTransforms: {
    chatComplete: DeepSeekChatCompleteResponseTransform,
    'stream-chatComplete': DeepSeekChatCompleteStreamChunkTransform,
  },
};

export default DeepSeekConfig;
