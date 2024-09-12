import { ProviderAPIConfig } from '../types';

const DeepbricksAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.deepbricks.ai/v1',
  headers: ({ providerOptions }) => {
    const headersObj: Record<string, string> = {
      Authorization: `Bearer ${providerOptions.apiKey}`,
    };
    if (providerOptions.openaiOrganization) {
      headersObj['Deepbricks-Organization'] =
        providerOptions.openaiOrganization;
    }

    if (providerOptions.openaiProject) {
      headersObj['Deepbricks-Project'] = providerOptions.openaiProject;
    }

    return headersObj;
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'chatComplete':
        return '/chat/completions';
      case 'imageGenerate':
        return '/images/generations';
      default:
        return '';
    }
  },
};

export default DeepbricksAPIConfig;
