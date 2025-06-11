"use client";

import { getCurrentWindow, invoke } from "@midday/desktop-client/core";
import {
  isDesktopApp,
  listenForDeepLinks,
} from "@midday/desktop-client/platform";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// This is used to show the window when the app is loaded
// And to handle deep links
export function DesktopProvider() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    const currentWindow = getCurrentWindow();
    const label = currentWindow.label;

    const emitSearchWindowState = async () => {
      try {
        if (pathname === "/") {
          // Enable search window for dashboard and login pages
          await currentWindow.emit("search-window-enabled", true);
          console.log("🔍 Search window enabled via event");
        } else if (pathname === "/login") {
          // Enable search window for login page
          await currentWindow.emit("search-window-enabled", false);
          console.log("🔍 Search window enabled via event");
        }
      } catch (error) {
        console.error("Failed to emit search window state:", error);
      }
    };

    if (label === "main") {
      emitSearchWindowState();
    }
  }, [pathname]);

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
        const label = currentWindow.label;

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

  // Add desktop navigation listener
  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    let unlistenNavigation: (() => void) | undefined;
    let unlistenParamsNavigation: (() => void) | undefined;

    const setupDesktopNavigationListener = async () => {
      try {
        const currentWindow = getCurrentWindow();
        const label = currentWindow.label;

        // Only set up navigation listener in the main window
        if (label !== "main") {
          console.log(
            `🚀 Skipping desktop navigation setup - not in main window (current: ${label})`,
          );
          return;
        }

        console.log("🚀 Setting up desktop navigation listener...");

        // Handle full path navigation
        unlistenNavigation = await currentWindow.listen(
          "desktop-navigate",
          (event) => {
            const { path, params } = event.payload as {
              path: string;
              params?: Record<string, any>;
            };
            console.log("🚀 Desktop navigation received in main window:", {
              path,
              params,
            });

            if (params && Object.keys(params).length > 0) {
              // Build URL with parameters
              const searchParams = new URLSearchParams();
              for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                  searchParams.set(key, String(value));
                }
              }
              const fullPath = `${path}?${searchParams.toString()}`;
              console.log(`📍 Main window navigating to: ${fullPath}`);
              router.push(fullPath);
            } else {
              console.log(`📍 Main window navigating to: ${path}`);
              router.push(path);
            }
          },
        );

        // Handle parameter-only navigation (stay on current page)
        unlistenParamsNavigation = await currentWindow.listen(
          "desktop-navigate-with-params",
          (event) => {
            const { params } = event.payload as { params: Record<string, any> };
            console.log(
              "🚀 Desktop params navigation received in main window:",
              { params },
            );

            // Get current pathname and apply parameters
            const currentPath = window.location.pathname;
            const searchParams = new URLSearchParams();

            for (const [key, value] of Object.entries(params)) {
              if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
              }
            }

            const fullPath = `${currentPath}?${searchParams.toString()}`;
            console.log(
              `📍 Main window adding params to current page: ${fullPath}`,
            );
            router.push(fullPath);
          },
        );

        console.log("✅ Desktop navigation listeners registered");
      } catch (error) {
        console.error("Failed to set up desktop navigation listener:", error);
      }
    };

    setupDesktopNavigationListener();

    // Cleanup function
    return () => {
      if (unlistenNavigation) {
        unlistenNavigation();
        console.log("🧹 Desktop navigation listener cleaned up");
      }
      if (unlistenParamsNavigation) {
        unlistenParamsNavigation();
        console.log("🧹 Desktop params navigation listener cleaned up");
      }
    };
  }, [router]);

  return null;
}
