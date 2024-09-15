import headlessuiPlugin from "@headlessui/tailwindcss";
import typographyPlugin from "@tailwindcss/typography";
import { type Config } from "tailwindcss";

import typographyStyles from "./typography";
import baseConfig from "@midday/ui/tailwind.config";

export default {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [baseConfig],
  plugins: [
    require("@todesktop/tailwind-variants"),
    typographyPlugin,
    headlessuiPlugin,
  ],
} satisfies Config;
