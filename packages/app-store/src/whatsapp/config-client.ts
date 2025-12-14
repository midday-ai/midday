import { baseConfig } from "./config-base";
import { onInitialize } from "./initialize";

// Client-side config - only imported by Next.js dashboard
export default {
  ...baseConfig,
  onInitialize,
  images: [] as string[],
};
