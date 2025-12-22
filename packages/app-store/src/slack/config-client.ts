import { baseConfig } from "./config-base";
import { onInitialize } from "./initialize";

// Client-side config with images - only imported by Next.js dashboard
// This file uses require() which works in webpack/bundler contexts but not in bun runtime
export default {
  ...baseConfig,
  onInitialize,
  images: [require("./assets/slack.jpg")],
};
