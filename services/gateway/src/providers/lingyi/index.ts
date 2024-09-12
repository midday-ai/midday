import { ProviderConfigs } from '../types';
import LingyiAPIConfig from './api';
import {
  LingyiChatCompleteConfig,
  LingyiChatCompleteResponseTransform,
  LingyiChatCompleteStreamChunkTransform,
} from './chatComplete';

const LingyiConfig: ProviderConfigs = {
  chatComplete: LingyiChatCompleteConfig,
  api: LingyiAPIConfig,
  responseTransforms: {
    chatComplete: LingyiChatCompleteResponseTransform,
    'stream-chatComplete': LingyiChatCompleteStreamChunkTransform,
  },
};

export default LingyiConfig;
