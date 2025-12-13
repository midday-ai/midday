import { baseConfig } from "./config-base";

// Server-safe config without images - used by API
// Images are excluded to avoid bun trying to execute PNG files when imported in server contexts
export default {
  ...baseConfig,
  images: [] as string[],
};
