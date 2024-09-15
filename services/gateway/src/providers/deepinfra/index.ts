import { ProviderConfigs } from "../types";
import DeepInfraApiConfig from "./api";
import {
  DeepInfraChatCompleteConfig,
  DeepInfraChatCompleteResponseTransform,
  DeepInfraChatCompleteStreamChunkTransform,
} from "./chatComplete";

const DeepInfraConfig: ProviderConfigs = {
  chatComplete: DeepInfraChatCompleteConfig,
  api: DeepInfraApiConfig,
  responseTransforms: {
    chatComplete: DeepInfraChatCompleteResponseTransform,
    "stream-chatComplete": DeepInfraChatCompleteStreamChunkTransform,
  },
};

export default DeepInfraConfig;
