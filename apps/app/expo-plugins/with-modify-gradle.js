// This plugin is required for fixing `.apk` build issue
// It appends Expo and RN versions into the `build.gradle` file
// References:
// https://github.com/t3-oss/create-t3-turbo/issues/120
// https://github.com/expo/expo/issues/18129

/** @type {import("@expo/config-plugins").ConfigPlugin} */
const defineConfig = (config) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("@expo/config-plugins").withProjectBuildGradle(
    config,
    (config) => {
      if (!config.modResults.contents.includes("ext.getPackageJsonVersion =")) {
        config.modResults.contents = config.modResults.contents.replace(
          "buildscript {",
          `buildscript {
    ext.getPackageJsonVersion = { packageName ->
        new File(['node', '--print', "JSON.parse(require('fs').readFileSync(require.resolve('\${packageName}/package.json'), 'utf-8')).version"].execute(null, rootDir).text.trim())
    }`,
        );
      }

      if (!config.modResults.contents.includes("reactNativeVersion =")) {
        config.modResults.contents = config.modResults.contents.replace(
          "ext {",
          `ext {
        reactNativeVersion = "\${ext.getPackageJsonVersion('react-native')}"`,
        );
      }

      if (!config.modResults.contents.includes("expoPackageVersion =")) {
        config.modResults.contents = config.modResults.contents.replace(
          "ext {",
          `ext {
        expoPackageVersion = "\${ext.getPackageJsonVersion('expo')}"`,
        );
      }

      return config;
    },
  );
};

module.exports = defineConfig;
