import { object, platform } from "@todesktop/client-core";

async function main() {
  // Menu items
  await object.on("open-x", () => {
    platform.os.openURL("https://x.com/middayai");
  });

  await object.on("open-discord", () => {
    platform.os.openURL("https://discord.gg/ZmqcvWKH");
  });

  await object.on("open-github", () => {
    platform.os.openURL("https://github.com/midday-ai/midday");
  });
}

main();
