import { ProviderConfigs } from "../types";
import GoogleApiConfig from "./api";
import {
  GoogleChatCompleteConfig,
  GoogleChatCompleteResponseTransform,
  GoogleChatCompleteStreamChunkTransform,
} from "./chatComplete";
import { GoogleEmbedConfig, GoogleEmbedResponseTransform } from "./embed";

const GoogleConfig: ProviderConfigs = {
  api: GoogleApiConfig,
  chatComplete: GoogleChatCompleteConfig,
  embed: GoogleEmbedConfig,
  responseTransforms: {
    chatComplete: GoogleChatCompleteResponseTransform,
    "stream-chatComplete": GoogleChatCompleteStreamChunkTransform,
    embed: GoogleEmbedResponseTransform,
  },
};

export default GoogleConfig;
