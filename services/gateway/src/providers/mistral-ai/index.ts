import { ProviderConfigs } from '../types';
import MistralAIAPIConfig from './api';
import {
  MistralAIChatCompleteConfig,
  MistralAIChatCompleteResponseTransform,
  MistralAIChatCompleteStreamChunkTransform,
} from './chatComplete';
import { MistralAIEmbedConfig, MistralAIEmbedResponseTransform } from './embed';

const MistralAIConfig: ProviderConfigs = {
  chatComplete: MistralAIChatCompleteConfig,
  embed: MistralAIEmbedConfig,
  api: MistralAIAPIConfig,
  responseTransforms: {
    chatComplete: MistralAIChatCompleteResponseTransform,
    'stream-chatComplete': MistralAIChatCompleteStreamChunkTransform,
    embed: MistralAIEmbedResponseTransform,
  },
};

export default MistralAIConfig;
