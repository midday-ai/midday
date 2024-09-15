import { ProviderAPIConfig } from "../types";

const RekaAIApiConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api.reka.ai",
  headers: ({ providerOptions }) => {
    return { "x-api-key": `${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case "chatComplete":
        return "/chat";
      default:
        return "";
    }
  },
};

export default RekaAIApiConfig;
