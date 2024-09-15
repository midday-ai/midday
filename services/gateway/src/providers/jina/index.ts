import { ProviderConfigs } from "../types";
import JinaAPIConfig from "./api";
import { JinaEmbedConfig, JinaEmbedResponseTransform } from "./embed";

const JinaConfig: ProviderConfigs = {
  embed: JinaEmbedConfig,
  api: JinaAPIConfig,
  responseTransforms: {
    embed: JinaEmbedResponseTransform,
  },
};

export default JinaConfig;
