import { ProviderConfigs } from "../types";
import MonsterAPIApiConfig from "./api";
import {
  MonsterAPIChatCompleteConfig,
  MonsterAPIChatCompleteResponseTransform,
} from "./chatComplete";

const MonsterAPIConfig: ProviderConfigs = {
  api: MonsterAPIApiConfig,
  chatComplete: MonsterAPIChatCompleteConfig,
  responseTransforms: {
    chatComplete: MonsterAPIChatCompleteResponseTransform,
  },
};

export default MonsterAPIConfig;
