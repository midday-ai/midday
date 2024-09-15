import { ProviderAPIConfig } from "../types";

const NovitaAIApiConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api.novita.ai/v3/openai",
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case "complete":
        return "/v1/completions";
      case "chatComplete":
        return "/v1/chat/completions";
      default:
        return "";
    }
  },
};

export default NovitaAIApiConfig;
