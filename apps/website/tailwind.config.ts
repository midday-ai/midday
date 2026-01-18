import baseConfig from "@midday/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [baseConfig],
  theme: {
    container: {
      center: true,
    },
    extend: {
      keyframes: {
        "dropdown-fade": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "dropdown-slide": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "mobile-slide": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "dropdown-fade": "dropdown-fade 0.15s ease-out forwards",
        "dropdown-slide": "dropdown-slide 0.2s ease-out forwards",
        "mobile-slide": "mobile-slide 0.2s ease-out forwards",
      },
    },
  },
} satisfies Config;
