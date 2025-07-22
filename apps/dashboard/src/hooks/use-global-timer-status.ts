"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

// Create a favicon with green dot overlaid on the original
function createFaviconWithDot(originalFaviconUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve("");
      return;
    }

    canvas.width = 32;
    canvas.height = 32;

    // Load the original favicon image
    const img = new Image();
    img.onload = () => {
      // Draw the original favicon
      ctx.drawImage(img, 0, 0, 32, 32);

      // Add green dot in the top-right corner with subtle shadow
      // Draw subtle shadow first
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.arc(26, 8, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw main green dot
      ctx.fillStyle = "#00C969";
      ctx.beginPath();
      ctx.arc(25, 7, 4, 0, 2 * Math.PI);
      ctx.fill();

      const dataUrl = canvas.toDataURL("image/png");
      resolve(dataUrl);
    };
    img.onerror = () => {
      // Create a simple fallback favicon with just the green dot
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 32, 32);

      // Add green dot
      ctx.fillStyle = "#00C969";
      ctx.beginPath();
      ctx.arc(25, 7, 6, 0, 2 * Math.PI);
      ctx.fill();

      const dataUrl = canvas.toDataURL("image/png");
      resolve(dataUrl);
    };
    img.crossOrigin = "anonymous"; // Handle CORS if needed
    img.src = originalFaviconUrl;
  });
}

// Update the favicon in the document head
function updateFavicon(dataUrl: string) {
  const favicon = document.querySelector(
    'link[rel*="icon"]',
  ) as HTMLLinkElement;

  if (favicon) {
    favicon.remove?.();
  }

  // Create new favicon element to force browser refresh
  const newFavicon = document.createElement("link");
  newFavicon.rel = "icon";
  newFavicon.type = "image/png";
  newFavicon.href = dataUrl;
  document.head.appendChild(newFavicon);
}

// Get the original favicon URL, with fallback to default
function getOriginalFaviconUrl(): string {
  const existingFavicon = document.querySelector(
    'link[rel*="icon"]',
  ) as HTMLLinkElement;
  if (existingFavicon?.href) {
    return existingFavicon.href;
  }
  // Fallback to default favicon path
  return "/favicon.ico";
}

export function useGlobalTimerStatus() {
  const trpc = useTRPC();
  const originalTitleRef = useRef<string | undefined>(undefined);
  const originalFaviconRef = useRef<string | undefined>(undefined);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0);

  // Get current timer status (only initial fetch, no automatic refetching)
  const { data: timerStatus } = useQuery({
    ...trpc.trackerEntries.getTimerStatus.queryOptions(),
    refetchInterval: false, // Don't refetch automatically
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Store original title and favicon on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Store original title
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title;
    }

    // Store original favicon with fallback
    if (!originalFaviconRef.current) {
      originalFaviconRef.current = getOriginalFaviconUrl();
    }
  }, []);

  // Manage local timer interval
  useEffect(() => {
    const isRunning = timerStatus?.isRunning;

    if (isRunning) {
      // Reset local counter when timer status changes
      setLocalElapsedSeconds(0);

      // Start local interval to increment every second
      intervalRef.current = setInterval(() => {
        setLocalElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Clear interval and reset local counter when not running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setLocalElapsedSeconds(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerStatus?.isRunning, timerStatus?.elapsedTime]);

  // Update title and favicon based on timer status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isRunning = timerStatus?.isRunning;
    const serverElapsedTime = timerStatus?.elapsedTime || 0;
    const totalElapsedTime = serverElapsedTime + localElapsedSeconds;
    const projectName = timerStatus?.currentEntry?.trackerProject?.name;

    if (isRunning && projectName) {
      // Format time as HH:MM:SS for document title
      const hours = Math.floor(totalElapsedTime / 3600);
      const minutes = Math.floor((totalElapsedTime % 3600) / 60);
      const seconds = totalElapsedTime % 60;
      const timeDisplay = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      // Update title with timer
      document.title = `${timeDisplay} • ${projectName} | Midday`;

      // Update favicon with green dot - ensure we have original favicon URL
      const originalUrl = originalFaviconRef.current || getOriginalFaviconUrl();
      createFaviconWithDot(originalUrl).then((faviconUrl) => {
        if (faviconUrl) {
          updateFavicon(faviconUrl);
        }
      });
    } else {
      // Restore original title
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }

      // Restore original favicon
      const originalUrl = originalFaviconRef.current || getOriginalFaviconUrl();
      updateFavicon(originalUrl);
    }
  }, [
    timerStatus?.isRunning,
    timerStatus?.elapsedTime,
    timerStatus?.currentEntry?.trackerProject?.name,
    localElapsedSeconds,
  ]);

  const serverElapsedTime = timerStatus?.elapsedTime || 0;
  const totalElapsedTime = serverElapsedTime + localElapsedSeconds;

  return {
    isRunning: timerStatus?.isRunning || false,
    elapsedTime: totalElapsedTime,
    currentProject: timerStatus?.currentEntry?.trackerProject?.name,
  };
}
