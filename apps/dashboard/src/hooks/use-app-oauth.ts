"use client";

import { createClient } from "@midday/supabase/client";
import { useEffect, useRef, useState } from "react";

interface UseAppOAuthOptions {
  installUrlEndpoint: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const CHANNEL_NAME = "midday_oauth_complete";
const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 800;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function useAppOAuth({
  installUrlEndpoint,
  onSuccess,
  onError,
}: UseAppOAuthOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  const connect = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}${installUrlEndpoint}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get install URL: ${response.statusText}`);
      }

      const { url } = await response.json();
      cleanupRef.current?.();

      let oauthCompleted = false;
      let checkInterval: ReturnType<typeof setInterval> | null = null;
      let popupClosedTimeout: ReturnType<typeof setTimeout> | null = null;
      let broadcastChannel: BroadcastChannel | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const handleOAuthComplete = () => {
        if (oauthCompleted) return;
        oauthCompleted = true;
        cleanup();
        onSuccess?.();
        setIsLoading(false);
      };

      const cleanup = () => {
        checkInterval && clearInterval(checkInterval);
        popupClosedTimeout && clearTimeout(popupClosedTimeout);
        timeoutId && clearTimeout(timeoutId);
        broadcastChannel?.close();
        window.removeEventListener("message", messageListener);
        cleanupRef.current = null;
      };

      cleanupRef.current = cleanup;

      // Set up message listeners
      const messageListener = (e: MessageEvent) => {
        if (e.data === "app_oauth_completed") {
          handleOAuthComplete();
        }
      };

      window.addEventListener("message", messageListener);

      try {
        broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        broadcastChannel.onmessage = messageListener;
      } catch {
        // BroadcastChannel not supported
      }

      // Open popup
      const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
      const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2.5;
      const popupFeatures = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},top=${top},left=${left},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,copyhistory=no`;

      const popup = window.open(url, "", popupFeatures);

      if (!popup) {
        cleanup();
        window.location.href = url;
        return;
      }

      // Check if popup was closed manually
      checkInterval = setInterval(() => {
        if (popup.closed && !oauthCompleted) {
          clearInterval(checkInterval!);
          popupClosedTimeout = setTimeout(() => {
            if (!oauthCompleted) {
              cleanup();
              onError?.(new Error("OAuth popup was closed without completing"));
              setIsLoading(false);
            }
          }, 1500);
        }
      }, 500);

      // Timeout after 5 minutes
      timeoutId = setTimeout(() => {
        if (!oauthCompleted) {
          cleanup();
          onError?.(new Error("OAuth flow timed out after 5 minutes"));
          setIsLoading(false);
        }
      }, TIMEOUT_MS);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      setIsLoading(false);
    }
  };

  return { connect, isLoading };
}
