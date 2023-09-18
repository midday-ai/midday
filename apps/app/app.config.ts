import type { ExpoConfig } from "@expo/config";

const defineConfig = (): ExpoConfig => ({
  name: "Midday",
  slug: "expo",
  scheme: "midday",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#fff",
    dark: {
      image: "./assets/splash-dark.png",
      resizeMode: "cover",
      backgroundColor: "#000",
    },
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "app.midday",
    buildNumber: "4",
    infoPlist: {
      CADisableMinimumFrameDurationOnPhone: true,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#fff",
    },
  },
  // extra: {
  //   eas: {
  //     projectId: "",
  //   },
  // },
  experiments: {
    tsconfigPaths: true,
  },
  plugins: ["./expo-plugins/with-modify-gradle.js"],
});

export default defineConfig;
