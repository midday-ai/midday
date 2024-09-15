import { ProviderAPIConfig } from "../types";

const DeepInfraApiConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api.deepinfra.com/v1/openai",
  headers: ({ providerOptions }) => {
    return {
      Authorization: `Bearer ${providerOptions.apiKey}`,
    };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case "chatComplete":
        return "/chat/completions";
      default:
        return "";
    }
  },
};

export default DeepInfraApiConfig;
