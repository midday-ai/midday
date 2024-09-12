import { create, themes } from "@storybook/theming/create";

export default create({
  ...themes.dark,
  base: "dark",
  // Typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: "monospace",

  brandTitle: "Solomon AI | Storybook",
  brandUrl: "https://solomon-ai.app",
  brandImage: "https://cdn.midday.ai/opengraph-image.jpg",
  brandTarget: "_self",

  //
  colorPrimary: "#3A10E5",
  colorSecondary: "#1D1D1D",

  // UI
  appBg: "#121212",
  appContentBg: "#121212",
  appPreviewBg: "#121212",
  appBorderColor: "#262626",
  appBorderRadius: 4,

  // Text colors
  textColor: "#878787",
  textInverseColor: "#fff",

  // Toolbar default and active colors
  barTextColor: "#878787",
  barSelectedColor: "#1D1D1D",
  barBg: "#121212",

  // Form colors
  inputBg: "#121212",
  inputBorder: "#10162F",
  inputTextColor: "#10162F",
  inputBorderRadius: 0,
});
