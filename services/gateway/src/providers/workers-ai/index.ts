import { ProviderConfigs } from '../types';
import WorkersAiAPIConfig from './api';
import {
  WorkersAiChatCompleteConfig,
  WorkersAiChatCompleteResponseTransform,
  WorkersAiChatCompleteStreamChunkTransform,
} from './chatComplete';
import {
  WorkersAiCompleteConfig,
  WorkersAiCompleteResponseTransform,
  WorkersAiCompleteStreamChunkTransform,
} from './complete';
import { WorkersAiEmbedConfig, WorkersAiEmbedResponseTransform } from './embed';

const WorkersAiConfig: ProviderConfigs = {
  complete: WorkersAiCompleteConfig,
  chatComplete: WorkersAiChatCompleteConfig,
  api: WorkersAiAPIConfig,
  embed: WorkersAiEmbedConfig,
  responseTransforms: {
    'stream-complete': WorkersAiCompleteStreamChunkTransform,
    complete: WorkersAiCompleteResponseTransform,
    chatComplete: WorkersAiChatCompleteResponseTransform,
    'stream-chatComplete': WorkersAiChatCompleteStreamChunkTransform,
    embed: WorkersAiEmbedResponseTransform,
  },
};

export default WorkersAiConfig;
