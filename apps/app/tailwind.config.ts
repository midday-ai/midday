import type { Config } from "tailwindcss";

import baseConfig from "@midday/tailwind";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [baseConfig],
} satisfies Config;