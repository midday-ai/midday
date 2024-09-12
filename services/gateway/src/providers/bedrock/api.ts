import { ProviderAPIConfig } from '../types';
import { generateAWSHeaders } from './utils';

const BedrockAPIConfig: ProviderAPIConfig = {
  getBaseURL: ({ providerOptions }) =>
    `https://bedrock-runtime.${providerOptions.awsRegion || 'us-east-1'}.amazonaws.com`,
  headers: async ({
    providerOptions,
    transformedRequestBody,
    transformedRequestUrl,
  }) => {
    const headers = {
      'content-type': 'application/json',
    };

    return generateAWSHeaders(
      transformedRequestBody,
      headers,
      transformedRequestUrl,
      'POST',
      'bedrock',
      providerOptions.awsRegion || '',
      providerOptions.awsAccessKeyId || '',
      providerOptions.awsSecretAccessKey || '',
      providerOptions.awsSessionToken || ''
    );
  },
  getEndpoint: ({ fn, gatewayRequestBody }) => {
    const { model, stream } = gatewayRequestBody;
    let mappedFn = fn;
    if (stream) {
      mappedFn = `stream-${fn}`;
    }
    const endpoint = `/model/${model}/invoke`;
    const streamEndpoint = `/model/${model}/invoke-with-response-stream`;
    switch (mappedFn) {
      case 'chatComplete': {
        return endpoint;
      }
      case 'stream-chatComplete': {
        return streamEndpoint;
      }
      case 'complete': {
        return endpoint;
      }
      case 'stream-complete': {
        return streamEndpoint;
      }
      case 'embed': {
        return endpoint;
      }
      case 'imageGenerate': {
        return endpoint;
      }
      default:
        return '';
    }
  },
};

export default BedrockAPIConfig;
