import { baseConfig } from "./config-base";

// Client-side config with images - only imported by Next.js dashboard
// This file uses require() which works in webpack/bundler contexts but not in bun runtime
// Note: Gmail uses useAppOAuth hook directly in the component (like Slack), not onInitialize
export default {
  ...baseConfig,
  images: [] as string[], // Add Gmail images if available
};

