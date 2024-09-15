import { ProviderConfigs } from "../types";
import NomicAPIConfig from "./api";
import { NomicEmbedConfig, NomicEmbedResponseTransform } from "./embed";

const NomicConfig: ProviderConfigs = {
  embed: NomicEmbedConfig,
  api: NomicAPIConfig,
  responseTransforms: {
    embed: NomicEmbedResponseTransform,
  },
};

export default NomicConfig;
