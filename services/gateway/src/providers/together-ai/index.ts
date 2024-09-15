import { ProviderConfigs } from "../types";
import TogetherAIApiConfig from "./api";
import {
  TogetherAIChatCompleteConfig,
  TogetherAIChatCompleteResponseTransform,
  TogetherAIChatCompleteStreamChunkTransform,
} from "./chatComplete";
import {
  TogetherAICompleteConfig,
  TogetherAICompleteResponseTransform,
  TogetherAICompleteStreamChunkTransform,
} from "./complete";
import {
  TogetherAIEmbedConfig,
  TogetherAIEmbedResponseTransform,
} from "./embed";

const TogetherAIConfig: ProviderConfigs = {
  complete: TogetherAICompleteConfig,
  chatComplete: TogetherAIChatCompleteConfig,
  embed: TogetherAIEmbedConfig,
  api: TogetherAIApiConfig,
  responseTransforms: {
    "stream-complete": TogetherAICompleteStreamChunkTransform,
    complete: TogetherAICompleteResponseTransform,
    chatComplete: TogetherAIChatCompleteResponseTransform,
    "stream-chatComplete": TogetherAIChatCompleteStreamChunkTransform,
    embed: TogetherAIEmbedResponseTransform,
  },
};

export default TogetherAIConfig;
