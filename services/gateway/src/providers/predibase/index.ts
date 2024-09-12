import { ProviderConfigs } from '../types';
import PredibaseAPIConfig from './api';
import {
  PredibaseChatCompleteConfig,
  PredibaseChatCompleteResponseTransform,
  PredibaseChatCompleteStreamChunkTransform,
} from './chatComplete';

const PredibaseConfig: ProviderConfigs = {
  chatComplete: PredibaseChatCompleteConfig,
  api: PredibaseAPIConfig,
  responseTransforms: {
    chatComplete: PredibaseChatCompleteResponseTransform,
    'stream-chatComplete': PredibaseChatCompleteStreamChunkTransform,
  },
};

export default PredibaseConfig;
