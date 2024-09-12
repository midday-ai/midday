import { ProviderConfigs } from '../types';
import { OllamaEmbedConfig, OllamaEmbedResponseTransform } from './embed';
import OllamaAPIConfig from './api';
import {
  OllamaChatCompleteConfig,
  OllamaChatCompleteResponseTransform,
  OllamaChatCompleteStreamChunkTransform,
} from './chatComplete';

const OllamaConfig: ProviderConfigs = {
  embed: OllamaEmbedConfig,
  api: OllamaAPIConfig,
  chatComplete: OllamaChatCompleteConfig,
  responseTransforms: {
    chatComplete: OllamaChatCompleteResponseTransform,
    'stream-chatComplete': OllamaChatCompleteStreamChunkTransform,
    embed: OllamaEmbedResponseTransform,
  },
};

export default OllamaConfig;
