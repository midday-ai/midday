import { ProviderAPIConfig } from "../types";

const NomicAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api-atlas.nomic.ai/v1",
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case "embed":
        return "/embedding/text";
      default:
        return "";
    }
  },
};

export default NomicAPIConfig;
