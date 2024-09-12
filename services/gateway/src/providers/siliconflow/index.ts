import { ProviderConfigs } from '../types';
import {
  SiliconFlowEmbedConfig,
  SiliconFlowEmbedResponseTransform,
} from './embed';
import SiliconFlowAPIConfig from './api';
import {
  SiliconFlowChatCompleteConfig,
  SiliconFlowChatCompleteResponseTransform,
} from './chatComplete';
import {
  SiliconFlowImageGenerateConfig,
  SiliconFlowImageGenerateResponseTransform,
} from './imageGenerate';

const SiliconFlowConfig: ProviderConfigs = {
  embed: SiliconFlowEmbedConfig,
  api: SiliconFlowAPIConfig,
  chatComplete: SiliconFlowChatCompleteConfig,
  imageGenerate: SiliconFlowImageGenerateConfig,
  responseTransforms: {
    chatComplete: SiliconFlowChatCompleteResponseTransform,
    embed: SiliconFlowEmbedResponseTransform,
    imageGenerate: SiliconFlowImageGenerateResponseTransform,
  },
};

export default SiliconFlowConfig;
