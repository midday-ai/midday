import { ProviderAPIConfig } from "../types";

const GroqAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api.groq.com/openai/v1",
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
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

export default GroqAPIConfig;
