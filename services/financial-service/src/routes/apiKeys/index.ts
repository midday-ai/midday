import { App } from "@/hono/app";
import { registerV1CreateApiKey } from "./v1_create_api_key";
import { registerV1DeleteApiKey } from "./v1_delete_api_key";
import { registerV1GetApiKeys } from "./v1_get_api_keys";

const registerApiKeysApi = (app: App): void => {
  registerV1CreateApiKey(app);
  registerV1GetApiKeys(app);
  registerV1DeleteApiKey(app);
};

export { registerApiKeysApi };
