import { ProviderConfigs } from "../types";
import CohereAPIConfig from "./api";
import {
  CohereChatCompleteConfig,
  CohereChatCompleteResponseTransform,
  CohereChatCompleteStreamChunkTransform,
} from "./chatComplete";
import {
  CohereCompleteConfig,
  CohereCompleteResponseTransform,
  CohereCompleteStreamChunkTransform,
} from "./complete";
import { CohereEmbedConfig, CohereEmbedResponseTransform } from "./embed";

const CohereConfig: ProviderConfigs = {
  complete: CohereCompleteConfig,
  chatComplete: CohereChatCompleteConfig,
  embed: CohereEmbedConfig,
  api: CohereAPIConfig,
  responseTransforms: {
    complete: CohereCompleteResponseTransform,
    "stream-complete": CohereCompleteStreamChunkTransform,
    chatComplete: CohereChatCompleteResponseTransform,
    "stream-chatComplete": CohereChatCompleteStreamChunkTransform,
    embed: CohereEmbedResponseTransform,
  },
};

export default CohereConfig;
