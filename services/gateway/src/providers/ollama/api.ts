import { ProviderAPIConfig } from "../types";

const OllamaAPIConfig: ProviderAPIConfig = {
  headers: () => {
    return {};
  },
  getBaseURL: ({ providerOptions }) => {
    return providerOptions.customHost ?? "";
  },
  getEndpoint: ({ fn, providerOptions }) => {
    let mappedFn = fn;
    const { urlToFetch } = providerOptions;
    if (fn === "proxy" && urlToFetch && urlToFetch?.indexOf("/api/chat") > -1) {
      mappedFn = "chatComplete";
    } else if (
      fn === "proxy" &&
      urlToFetch &&
      urlToFetch?.indexOf("/embeddings") > -1
    ) {
      mappedFn = "embed";
    }

    switch (mappedFn) {
      case "chatComplete": {
        return `/v1/chat/completions`;
      }
      case "embed": {
        return `/api/embeddings`;
      }
      default:
        return "";
    }
  },
};

export default OllamaAPIConfig;
