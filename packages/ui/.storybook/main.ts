import { dirname, join } from "path";
import type { StorybookConfig } from "@storybook/react-vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  addons: [
    "@storybook/addon-links",
    {
      name: "@storybook/addon-essentials",
      options: {
        backgrounds: false,
        outline: false,
        measure: false,
        viewport: false,
      },
    },
    "@storybook/addon-themes",
  ],
  docs: {
    autodocs: "tag",
  },
};
export default config;
