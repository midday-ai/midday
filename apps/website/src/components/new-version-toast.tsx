"use client";

import { Button } from "@midday/ui/button";
import { toast } from "@midday/ui/use-toast";
import { useEffect, useRef } from "react";

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export function NewVersionChecker() {
  const initialBuildId = useRef<string | null>(null);
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Get the initial build ID from Next.js
    if (typeof window !== "undefined" && window.__NEXT_DATA__?.buildId) {
      initialBuildId.current = window.__NEXT_DATA__.buildId;
    }

    const checkForNewVersion = async () => {
      if (!initialBuildId.current || hasShownToast.current) return;

      try {
        // Fetch the homepage and parse __NEXT_DATA__ to get the build ID
        const htmlResponse = await fetch("/", { cache: "no-store" });
        const html = await htmlResponse.text();

        // Extract buildId from the __NEXT_DATA__ script
        const match = html.match(/"buildId":"([^"]+)"/);
        const newBuildId = match?.[1];

        if (newBuildId && newBuildId !== initialBuildId.current) {
          hasShownToast.current = true;
          showReloadToast();
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.debug("Version check failed:", error);
      }
    };

    // Check periodically
    const interval = setInterval(checkForNewVersion, CHECK_INTERVAL);

    // Also check when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForNewVersion();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

function showReloadToast() {
  toast({
    id: "new-version",
    title: "New version available",
    description: "Refresh to get the latest experience.",
    duration: Number.POSITIVE_INFINITY,
    action: (
      <Button
        size="sm"
        variant="outline"
        onClick={() => window.location.reload()}
        className="ml-2 shrink-0"
      >
        Refresh
      </Button>
    ),
  });
}
