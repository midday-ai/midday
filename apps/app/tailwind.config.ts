import type { Config } from "tailwindcss";
import baseConfig from "@midday/tailwind-config";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        title: ["BodoniModa_800ExtraBold"],
      },
    },
  },
} satisfies Config;
