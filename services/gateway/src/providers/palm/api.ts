import { ProviderAPIConfig } from "../types";

export const PalmApiConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://generativelanguage.googleapis.com/v1beta3",
  headers: () => {
    return { "Content-Type": "application/json" };
  },
  getEndpoint: ({ providerOptions, fn, gatewayRequestBody }) => {
    const { apiKey } = providerOptions;
    const { model } = gatewayRequestBody;
    switch (fn) {
      case "complete": {
        return `/models/${model}:generateText?key=${apiKey}`;
      }
      case "chatComplete": {
        return `/models/${model}:generateMessage?key=${apiKey}`;
      }
      case "embed": {
        return `/models/${model}:embedText?key=${apiKey}`;
      }
      default:
        return "";
    }
  },
};

export default PalmApiConfig;
