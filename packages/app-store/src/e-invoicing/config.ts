import { baseConfig } from "./config-base";

// Server-safe config without images - used by API
export default {
  ...baseConfig,
  images: [] as string[],
};

