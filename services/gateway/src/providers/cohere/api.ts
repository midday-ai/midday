import { ProviderAPIConfig } from '../types';

const CohereAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.cohere.ai/v1',
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'chatComplete':
        return '/chat';
      case 'complete':
        return '/generate';
      case 'embed':
        return '/embed';
      default:
        return '';
    }
  },
};

export default CohereAPIConfig;
