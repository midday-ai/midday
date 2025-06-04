"use client";

import {
  isDesktopApp,
  listenForDeepLinks,
} from "@midday/desktop-client/platform";
import { invoke } from "@tauri-apps/api/core";
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
