import { ProviderAPIConfig } from "../types";

const MoonshotAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api.moonshot.cn",
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` }; // https://platform.moonshot.cn/console/api-keys
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case "chatComplete":
        return "/v1/chat/completions";
      default:
        return "";
    }
  },
};

export default MoonshotAPIConfig;
