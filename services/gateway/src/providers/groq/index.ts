import { ProviderConfigs } from "../types";
import GroqAPIConfig from "./api";
import {
  GroqChatCompleteConfig,
  GroqChatCompleteResponseTransform,
  GroqChatCompleteStreamChunkTransform,
} from "./chatComplete";

const GroqConfig: ProviderConfigs = {
  chatComplete: GroqChatCompleteConfig,
  api: GroqAPIConfig,
  responseTransforms: {
    chatComplete: GroqChatCompleteResponseTransform,
    "stream-chatComplete": GroqChatCompleteStreamChunkTransform,
  },
};

export default GroqConfig;
