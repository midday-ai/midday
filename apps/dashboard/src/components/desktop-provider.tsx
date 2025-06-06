"use client";

import { emit, getCurrentWindow, invoke } from "@midday/desktop-client/core";
import {
  isDesktopApp,
  listenForDeepLinks,
} from "@midday/desktop-client/platform";
import { createClient } from "@midday/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// This is used to show the window when the app is loaded
// And to handle deep links
export function DesktopProvider() {
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    console.log("🔐 Setting up auth state management");

    // Check initial auth state immediately
    const checkInitialAuthState = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const authenticated = !!session;

        console.log("🔐 Initial auth state check:", {
          authenticated,
          hasSession: !!session,
          sessionUserId: session?.user?.id,
        });

        // Set initial auth status via direct command
        console.log("🔐 Calling set_auth_status command:", authenticated);
        await invoke("set_auth_status", { authStatus: authenticated });
        console.log("✅ Successfully called set_auth_status:", authenticated);
      } catch (error) {
        console.error("❌ Failed to check/emit initial auth status:", error);
      }
    };

    // Check auth state immediately
    checkInitialAuthState();

    // Listen for auth state changes - this fires immediately with current session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authenticated = !!session;

      console.log("🔐 Auth state change detected:", {
        event,
        authenticated,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
      });

      // Set auth status via direct command
      try {
        console.log("🔐 About to call set_auth_status command:", authenticated);
        await invoke("set_auth_status", { authStatus: authenticated });
        console.log("✅ Successfully called set_auth_status:", authenticated);
      } catch (error) {
        console.error("❌ Failed to call set_auth_status:", error);
      }

      // If user logs out, request search window to close
      if (!authenticated) {
        console.log("🔐 User logged out, closing search window");
        try {
          await emit("search-window-close-requested", {});
        } catch (error) {
          console.error("Failed to close search window:", error);
        }
      } else {
        console.log("🔐 User is authenticated, search should be available now");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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
