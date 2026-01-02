import { baseConfig } from "./config-base";

// Client-side config with images - only imported by Next.js dashboard
export default {
  ...baseConfig,
  images: [require("./assets/stripe.jpg")],
};
