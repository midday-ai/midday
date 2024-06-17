import { createClient } from "@midday/supabase/client";
import {
  globalShortcut,
  nativeWindow,
  object,
  platform,
} from "@todesktop/client-core";

const windows = {
  command: "XEVrd9yvoaSgNhFr6GqYX",
  settings: "-IzzPFJXbNLud7h9nK5NB",
};

async function main() {
  // Menu items
  await object.on("open-x", () => {
    platform.os.openURL("https://go.midday.ai/lS72Toq");
  });

  await object.on("open-discord", () => {
    platform.os.openURL("https://go.midday.ai/anPiuRx");
  });

  await object.on("open-github", () => {
    platform.os.openURL("https://git.new/midday");
  });

  // Command menu
  await object.on("open-command-menu", async () => {
    const winRef = await object.retrieve({ id: windows.command });
    await nativeWindow.show({ ref: winRef });
  });

  globalShortcut.register("Control+Space", async () => {
    const winRef = await object.retrieve({ id: windows.command });

    if (await nativeWindow.isVisible({ ref: winRef })) {
      await nativeWindow.hide({ ref: winRef });
    } else {
      await nativeWindow.show({ ref: winRef });
    }
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
