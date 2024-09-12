import { ProviderAPIConfig } from '../types';

const HuggingfaceAPIConfig: ProviderAPIConfig = {
  getBaseURL: ({ providerOptions }) => {
    return (
      providerOptions.huggingfaceBaseUrl ||
      'https://api-inference.huggingface.co'
    );
  },
  headers: ({ providerOptions }) => ({
    Authorization: `Bearer ${providerOptions.apiKey}`,
  }),
  getEndpoint: ({ fn, gatewayRequestBody, providerOptions }) => {
    const { model } = gatewayRequestBody;
    const modelPath = providerOptions.huggingfaceBaseUrl
      ? ''
      : `/models/${model}`;
    switch (fn) {
      case 'chatComplete':
        return `${modelPath}/v1/chat/completions`;
      case 'complete':
        return `${modelPath}/v1/completions`;
      default:
        return '';
    }
  },
};

export default HuggingfaceAPIConfig;
