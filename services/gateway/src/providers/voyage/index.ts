import { ProviderConfigs } from '../types';
import VoyageAPIConfig from './api';
import { VoyageEmbedConfig, VoyageEmbedResponseTransform } from './embed';

const VoyageConfig: ProviderConfigs = {
  embed: VoyageEmbedConfig,
  api: VoyageAPIConfig,
  responseTransforms: {
    embed: VoyageEmbedResponseTransform,
  },
};

export default VoyageConfig;
