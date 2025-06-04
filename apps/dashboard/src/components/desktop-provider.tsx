"use client";

import {
  isDesktopApp,
  listenForDeepLinks,
} from "@midday/desktop-client/platform";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// This is used to show the window when the app is loaded
// And to handle deep links
export function DesktopProvider() {
  const router = useRouter();

  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    const showWindow = async () => {
      try {
        // Only run show_window logic if we're in the main window
        const currentWindow = getCurrentWindow();
        const label = currentWindow.label;

        if (label !== "main") {
          console.log(
            `📄 Skipping show_window - not in main window (current: ${label})`,
          );
          return;
        }

        console.log("📄 Calling show_window command");
        await invoke("show_window");
        console.log("✅ Window shown successfully");
      } catch (error) {
        console.error("Failed to show window:", error);
      }
    };

    // Simple timeout approach - let content load naturally then show window
    const timer = setTimeout(showWindow, 300);

    // Cleanup timer if component unmounts
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    let cleanup: (() => void) | undefined;

    const setupDeepLinkListener = async () => {
      try {
        // Only set up deep link listeners if we're in the main window
        const currentWindow = getCurrentWindow();
        const label = await currentWindow.label;

        if (label !== "main") {
          console.log(
            `🔗 Skipping deep link setup - not in main window (current: ${label})`,
          );
          return;
        }

        console.log("🔗 Setting up deep link listener...");

        cleanup = await listenForDeepLinks((path) => {
          console.log("🎯 Deep link navigation received:", path);

          // Handle different paths
          if (path === "" || path === "dashboard") {
            console.log("📍 Navigating to dashboard");
            router.push("/");
          } else if (path.startsWith("api/auth/callback")) {
            // Handle authentication callback
            console.log("🔐 Handling auth callback");
            router.push(`/${path}`);
          } else {
            // Handle other paths
            console.log(`📍 Navigating to: /${path}`);
            router.push(`/${path}`);
          }
        });
      } catch (error) {
        console.error("Failed to set up deep link listener:", error);
      }
    };

    setupDeepLinkListener();

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
        console.log("🧹 Deep link listener cleaned up");
      }
    };
  }, [router]);

  return null;
}
