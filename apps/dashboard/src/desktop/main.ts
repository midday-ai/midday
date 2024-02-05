import { createClient } from "@midday/supabase/client";
import {
  globalShortcut,
  nativeWindow,
  object,
  platform,
  tray,
} from "@todesktop/client-core";

const windows = {
  command: "XEVrd9yvoaSgNhFr6GqYX",
};

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}`;
}

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

  // Command menu
  await object.on("open-command-menu", async () => {
    const winRef = await object.retrieve({ id: windows.command });
    await nativeWindow.show({ ref: winRef });
  });

  globalShortcut.register("Escape", async () => {
    const winRef = await object.retrieve({ id: windows.command });

    if (await nativeWindow.isVisible({ ref: winRef })) {
      await nativeWindow.hide({ ref: winRef });
    }
  });

  // Auth state for command menu
  nativeWindow.on("focus", async () => {
    const winRef = await object.retrieve({ id: windows.command });

    if (
      winRef?.id === windows.command &&
      (await nativeWindow.isVisible({ ref: winRef }))
    ) {
      if (window.location.pathname !== "/desktop/command") {
        // TODO: Fix redirect from middleware if command

        window.location.pathname = "/desktop/command";
      } else {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          window.location.pathname = "/";
        }
      }
    }
  });

  // // Timer
  // function startTimer() {
  //   let remainingTime = 60;
  //   setInterval(() => {
  //     // Set the tray title to the remaining time
  //     tray.setTitle(formatTime(remainingTime));

  //     remainingTime += 1;
  //   }, 1000);
  // }

  // startTimer();
}

main();
