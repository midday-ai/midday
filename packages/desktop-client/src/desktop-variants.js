const plugin = require("tailwindcss/plugin");

const desktopPlugin = plugin(({ addVariant, e }) => {
  // Add support for `desktop` modifier
  // Usage: <div class="desktop:rounded-lg">...</div>
  addVariant("desktop", ({ modifySelectors, separator }) => {
    modifySelectors(({ className }) => {
      return `html.desktop .${e(`desktop${separator}${className}`)}`;
    });
  });

  // Add support for `mac`, `windows` and `linux` modifiers
  // Usage: <div class="mac:hidden">...</div>
  const platformMap = {
    darwin: "mac",
    win32: "windows",
    linux: "linux",
  };

  for (const platform of Object.keys(platformMap)) {
    const variant = platformMap[platform];
    addVariant(variant, ({ modifySelectors, separator }) => {
      modifySelectors(({ className }) => {
        return `html.desktop-platform-${platform} .${e(
          `${variant}${separator}${className}`,
        )}`;
      });
    });
  }
});

module.exports = desktopPlugin;
