import { ProviderAPIConfig } from '../types';

const WorkersAiAPIConfig: ProviderAPIConfig = {
  getBaseURL: ({ providerOptions }) => {
    const { workersAiAccountId } = providerOptions;
    return `https://api.cloudflare.com/client/v4/accounts/${workersAiAccountId}/ai/run`;
  },
  headers: ({ providerOptions }) => {
    const { apiKey } = providerOptions;
    return { Authorization: `Bearer ${apiKey}` };
  },
  getEndpoint: ({ fn, gatewayRequestBody: params }) => {
    const { model } = params;
    switch (fn) {
      case 'complete': {
        return `/${model}`;
      }
      case 'chatComplete': {
        return `/${model}`;
      }
      case 'embed':
        return `/${model}`;
      default:
        return '';
    }
  },
};

export default WorkersAiAPIConfig;
