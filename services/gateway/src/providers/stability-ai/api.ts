import { ProviderAPIConfig } from "../types";

const StabilityAIAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => "https://api.stability.ai/v1",
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn, gatewayRequestBody, providerOptions }) => {
    let mappedFn = fn;
    const { urlToFetch } = providerOptions;
    if (
      fn === "proxy" &&
      urlToFetch &&
      urlToFetch?.indexOf("text-to-image") > -1
    ) {
      mappedFn = "imageGenerate";
    }

    switch (mappedFn) {
      case "imageGenerate": {
        return `/generation/${gatewayRequestBody.model}/text-to-image`;
      }
      default:
        return "";
    }
  },
};

export default StabilityAIAPIConfig;
