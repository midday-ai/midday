import { ProviderAPIConfig } from '../types';

const MonsterAPIApiConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://llm.monsterapi.ai/v1',
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'chatComplete':
        return '/chat/completions';
      default:
        return '';
    }
  },
};

export default MonsterAPIApiConfig;
