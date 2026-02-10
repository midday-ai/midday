"use client";

import { createClient } from "@midday/supabase/client";
import { useEffect, useRef, useState } from "react";
import { isOAuthMessage, OAUTH_CHANNEL_NAME } from "@/utils/oauth-message";

interface UseAppOAuthOptions {
  installUrlEndpoint: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
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
    cleanupRef.current?.();

    let oauthCompleted = false;
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let popupClosedTimeout: ReturnType<typeof setTimeout> | null = null;
    let broadcastChannel: BroadcastChannel | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let popup: Window | null = null;

    const handleOAuthComplete = () => {
      if (oauthCompleted) return;
      oauthCompleted = true;
      cleanup();
      popup?.close();
      onSuccess?.();
      setIsLoading(false);
    };

    const handleOAuthError = () => {
      if (oauthCompleted) return;
      oauthCompleted = true;
      cleanup();
      // Don't close the popup immediately - let the user read the error message
      // displayed at /oauth-callback?status=error before closing it themselves
      onError?.(new Error("OAuth connection failed"));
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

    const messageListener = (e: MessageEvent) => {
      if (isOAuthMessage(e.data)) {
        if (e.data.type === "app_oauth_completed") {
          handleOAuthComplete();
        } else if (e.data.type === "app_oauth_error") {
          handleOAuthError();
        }
      }
    };

    window.addEventListener("message", messageListener);

    try {
      broadcastChannel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
      broadcastChannel.onmessage = messageListener;
    } catch {
      // BroadcastChannel not supported
    }

    // Open popup IMMEDIATELY (synchronously) to avoid popup blockers
    // Must be within user gesture context before any async operations
    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2.5;
    const popupFeatures = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},top=${top},left=${left},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,copyhistory=no`;

    popup = window.open("about:blank", "", popupFeatures);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        popup?.close();
        throw new Error("Not authenticated");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}${installUrlEndpoint}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        popup?.close();
        throw new Error(`Failed to get install URL: ${response.statusText}`);
      }

      const { url } = await response.json();

      // If popup was blocked or closed, fall back to same-window navigation
      if (!popup || popup.closed) {
        cleanup();
        window.location.href = url;
        return;
      }

      // Navigate the popup to the OAuth URL
      popup.location.href = url;

      // Check if popup was closed manually
      checkInterval = setInterval(() => {
        if (popup?.closed && !oauthCompleted) {
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
      popup?.close();
      cleanup();
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      setIsLoading(false);
    }
  };

  return { connect, isLoading };
}
