import { baseConfig } from "./config-base";

// Client-side config with images - only imported by Next.js dashboard
// OAuth is handled centrally via oauthAppConfig in unified-app.tsx
export default {
  ...baseConfig,
  images: [require("./assets/stripe.jpg")],
};
