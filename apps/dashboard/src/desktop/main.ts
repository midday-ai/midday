import { createClient } from "@midday/supabase/client";
import {
  globalShortcut,
  nativeWindow,
  object,
  platform,
} from "@todesktop/client-core";

const windows = {
  command: "XEVrd9yvoaSgNhFr6GqYX",
};

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

  // Auth state for command menu
  nativeWindow.on("focus", async () => {
    const winRef = await object.retrieve({ id: windows.command });
    const isCommandWindow = await nativeWindow.isVisible({ ref: winRef });

    if (isCommandWindow) {
      globalShortcut.register("Escape", async () => {
        await nativeWindow.hide({ ref: winRef });
      });
    } else {
      globalShortcut.unregister("Escape");
    }

    if (winRef?.id === windows.command && isCommandWindow) {
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
}

main();
