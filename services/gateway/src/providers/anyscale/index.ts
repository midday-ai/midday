import { ProviderConfigs } from '../types';
import AnyscaleAPIConfig from './api';
import {
  AnyscaleChatCompleteConfig,
  AnyscaleChatCompleteResponseTransform,
  AnyscaleChatCompleteStreamChunkTransform,
} from './chatComplete';
import {
  AnyscaleCompleteConfig,
  AnyscaleCompleteResponseTransform,
  AnyscaleCompleteStreamChunkTransform,
} from './complete';
import { AnyscaleEmbedConfig, AnyscaleEmbedResponseTransform } from './embed';

const AnyscaleConfig: ProviderConfigs = {
  complete: AnyscaleCompleteConfig,
  chatComplete: AnyscaleChatCompleteConfig,
  embed: AnyscaleEmbedConfig,
  api: AnyscaleAPIConfig,
  responseTransforms: {
    'stream-complete': AnyscaleCompleteStreamChunkTransform,
    complete: AnyscaleCompleteResponseTransform,
    chatComplete: AnyscaleChatCompleteResponseTransform,
    'stream-chatComplete': AnyscaleChatCompleteStreamChunkTransform,
    embed: AnyscaleEmbedResponseTransform,
  },
};

export default AnyscaleConfig;
