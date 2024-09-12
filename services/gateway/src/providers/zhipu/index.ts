import { ProviderConfigs } from '../types';
import ZhipuAPIConfig from './api';
import {
  ZhipuChatCompleteConfig,
  ZhipuChatCompleteResponseTransform,
  ZhipuChatCompleteStreamChunkTransform,
} from './chatComplete';
import { ZhipuEmbedConfig, ZhipuEmbedResponseTransform } from './embed';

const ZhipuConfig: ProviderConfigs = {
  chatComplete: ZhipuChatCompleteConfig,
  embed: ZhipuEmbedConfig,
  api: ZhipuAPIConfig,
  responseTransforms: {
    chatComplete: ZhipuChatCompleteResponseTransform,
    'stream-chatComplete': ZhipuChatCompleteStreamChunkTransform,
    embed: ZhipuEmbedResponseTransform,
  },
};

export default ZhipuConfig;
