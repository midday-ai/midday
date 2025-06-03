"use client";

import { listenForDeepLinks } from "@midday/desktop-client/platform";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DeepLinkProvider() {
  const router = useRouter();

  useEffect(() => {
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
