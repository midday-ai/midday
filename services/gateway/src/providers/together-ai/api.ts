import { ProviderAPIConfig } from "../types";

const TogetherAIApiConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api.together.xyz",
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case "complete":
        return "/v1/completions";
      case "chatComplete":
        return "/v1/chat/completions";
      case "embed":
        return "/v1/embeddings";
      default:
        return "";
    }
  },
};

export default TogetherAIApiConfig;
