import { ProviderAPIConfig } from '../types';

const LingYiAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.lingyiwanwu.com',
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` }; // https://platform.lingyiwanwu.com/apikeys
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

export default LingYiAPIConfig;
