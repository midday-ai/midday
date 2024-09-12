import { ProviderConfigs } from '../types';
import VertexApiConfig, { GoogleApiConfig } from './api';
import {
  GoogleChatCompleteResponseTransform,
  GoogleChatCompleteStreamChunkTransform,
  VertexAnthropicChatCompleteConfig,
  VertexAnthropicChatCompleteResponseTransform,
  VertexAnthropicChatCompleteStreamChunkTransform,
  VertexGoogleChatCompleteConfig,
  VertexLlamaChatCompleteConfig,
  VertexLlamaChatCompleteResponseTransform,
  VertexLlamaChatCompleteStreamChunkTransform,
} from './chatComplete';
import { getModelAndProvider } from './utils';

const VertexConfig: ProviderConfigs = {
  api: VertexApiConfig,
  getConfig: (params: Params) => {
    const providerModel = params.model;
    const { provider } = getModelAndProvider(providerModel as string);

    switch (provider) {
      case 'google':
        return {
          chatComplete: VertexGoogleChatCompleteConfig,
          api: GoogleApiConfig,
          responseTransforms: {
            'stream-chatComplete': GoogleChatCompleteStreamChunkTransform,
            chatComplete: GoogleChatCompleteResponseTransform,
          },
        };
      case 'anthropic':
        return {
          chatComplete: VertexAnthropicChatCompleteConfig,
          api: GoogleApiConfig,
          responseTransforms: {
            'stream-chatComplete':
              VertexAnthropicChatCompleteStreamChunkTransform,
            chatComplete: VertexAnthropicChatCompleteResponseTransform,
          },
        };
      case 'meta':
        return {
          chatComplete: VertexLlamaChatCompleteConfig,
          api: GoogleApiConfig,
          responseTransforms: {
            chatComplete: VertexLlamaChatCompleteResponseTransform,
            'stream-chatComplete': VertexLlamaChatCompleteStreamChunkTransform,
          },
        };
    }
  },
};

export default VertexConfig;
