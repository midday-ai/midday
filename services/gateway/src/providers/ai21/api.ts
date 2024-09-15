import { ProviderAPIConfig } from "../types";

const AI21APIConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api.ai21.com/studio/v1",
  headers: ({ providerOptions }) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${providerOptions.apiKey}`,
    };
    return headers;
  },
  getEndpoint: ({ fn, gatewayRequestBody }) => {
    const { model } = gatewayRequestBody;
    switch (fn) {
      case "complete": {
        return `/${model}/complete`;
      }
      case "chatComplete": {
        return `/${model}/chat`;
      }
      case "embed": {
        return `/embed`;
      }
      default:
        return "";
    }
  },
};

export default AI21APIConfig;
