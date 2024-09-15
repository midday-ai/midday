import { ProviderConfigs } from "../types";
import RekaAIApiConfig from "./api";
import {
  RekaAIChatCompleteConfig,
  RekaAIChatCompleteResponseTransform,
} from "./chatComplete";

const RekaAIConfig: ProviderConfigs = {
  chatComplete: RekaAIChatCompleteConfig,
  api: RekaAIApiConfig,
  responseTransforms: {
    chatComplete: RekaAIChatCompleteResponseTransform,
  },
};

export default RekaAIConfig;
