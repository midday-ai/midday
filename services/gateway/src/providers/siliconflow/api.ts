import { ProviderAPIConfig } from '../types';

const SiliconFlowAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.siliconflow.cn/v1',
  headers: ({ providerOptions }) => {
    return {
      Authorization: `Bearer ${providerOptions.apiKey}`,
    };
  },
  getEndpoint: ({ fn, gatewayRequestBody }) => {
    const { model = 'ByteDance/SDXL-Lightning' } = gatewayRequestBody;
    switch (fn) {
      case 'chatComplete':
        return '/chat/completions';
      case 'embed':
        return '/embeddings';
      case 'imageGenerate':
        return `/${model}/text-to-image`;
      default:
        return '';
    }
  },
};

export default SiliconFlowAPIConfig;
