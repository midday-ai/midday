import { ProviderAPIConfig } from '../types';

const DeepSeekAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.deepseek.com',
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` }; // https://platform.deepseek.com/api_keys
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'chatComplete':
        return '/v1/chat/completions';
      default:
        return '';
    }
  },
};

export default DeepSeekAPIConfig;
