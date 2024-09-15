import { ProviderConfigs } from "../types";
import PerplexityAIApiConfig from "./api";
import {
  PerplexityAIChatCompleteConfig,
  PerplexityAIChatCompleteResponseTransform,
  PerplexityAIChatCompleteStreamChunkTransform,
} from "./chatComplete";

const PerplexityAIConfig: ProviderConfigs = {
  chatComplete: PerplexityAIChatCompleteConfig,
  api: PerplexityAIApiConfig,
  responseTransforms: {
    chatComplete: PerplexityAIChatCompleteResponseTransform,
    "stream-chatComplete": PerplexityAIChatCompleteStreamChunkTransform,
  },
};

export default PerplexityAIConfig;
