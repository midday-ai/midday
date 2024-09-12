import { ProviderConfigs } from '../types';
import NovitaAIApiConfig from './api';
import {
  NovitaAIChatCompleteConfig,
  NovitaAIChatCompleteResponseTransform,
  NovitaAIChatCompleteStreamChunkTransform,
} from './chatComplete';
import {
  NovitaAICompleteConfig,
  NovitaAICompleteResponseTransform,
  NovitaAICompleteStreamChunkTransform,
} from './complete';

const NovitaAIConfig: ProviderConfigs = {
  complete: NovitaAICompleteConfig,
  chatComplete: NovitaAIChatCompleteConfig,
  api: NovitaAIApiConfig,
  responseTransforms: {
    'stream-complete': NovitaAICompleteStreamChunkTransform,
    complete: NovitaAICompleteResponseTransform,
    chatComplete: NovitaAIChatCompleteResponseTransform,
    'stream-chatComplete': NovitaAIChatCompleteStreamChunkTransform,
  },
};

export default NovitaAIConfig;
