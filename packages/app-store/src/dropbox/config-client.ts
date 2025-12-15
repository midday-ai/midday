import { baseConfig } from "./config-base";

// Client-side config - only imported by Next.js dashboard
export default {
  ...baseConfig,
  images: [require("./assets/image.jpg")],
};
