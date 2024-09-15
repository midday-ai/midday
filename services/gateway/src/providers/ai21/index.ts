import { ProviderConfigs } from "../types";
import AI21APIConfig from "./api";
import {
  AI21ChatCompleteConfig,
  AI21ChatCompleteResponseTransform,
} from "./chatComplete";
import { AI21CompleteConfig, AI21CompleteResponseTransform } from "./complete";
import { AI21EmbedConfig, AI21EmbedResponseTransform } from "./embed";

const AI21Config: ProviderConfigs = {
  complete: AI21CompleteConfig,
  chatComplete: AI21ChatCompleteConfig,
  embed: AI21EmbedConfig,
  api: AI21APIConfig,
  responseTransforms: {
    complete: AI21CompleteResponseTransform,
    chatComplete: AI21ChatCompleteResponseTransform,
    embed: AI21EmbedResponseTransform,
  },
};

export default AI21Config;
