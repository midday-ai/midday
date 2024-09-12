import { ProviderAPIConfig } from '../types';

const FireworksAIAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.fireworks.ai/inference/v1',
  headers: ({ providerOptions }) => {
    return {
      Authorization: `Bearer ${providerOptions.apiKey}`,
      Accept: 'application/json',
    };
  },
  getEndpoint: ({ fn, gatewayRequestBody }) => {
    const model = gatewayRequestBody?.model;
    switch (fn) {
      case 'complete':
        return '/completions';
      case 'chatComplete':
        return '/chat/completions';
      case 'embed':
        return '/embeddings';
      case 'imageGenerate':
        return `/image_generation/${model}`;
      default:
        return '';
    }
  },
};

export default FireworksAIAPIConfig;
