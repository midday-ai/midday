"use client";

import { createClient } from "@midday/supabase/client";
import { useState } from "react";

interface UseAppOAuthOptions {
  /**
   * API endpoint to fetch the OAuth install URL
   * e.g., "/apps/slack/install-url"
   */
  installUrlEndpoint: string;
  /**
   * Callback to run on successful OAuth completion
   */
  onSuccess?: () => void;
  /**
   * Callback to run on error
   */
  onError?: (error: Error) => void;
}

export function useAppOAuth({
  installUrlEndpoint,
  onSuccess,
  onError,
}: UseAppOAuthOptions) {
  const [isLoading, setIsLoading] = useState(false);

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

      const width = 600;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;

      const popup = window.open(
        url,
        "",
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`,
      );

      // The popup might have been blocked, so we redirect the user to the URL instead
      if (!popup) {
        window.location.href = url;
        return;
      }

      const listener = (e: MessageEvent) => {
        // Check if message is from our popup
        if (e.data === "app_oauth_completed") {
          window.removeEventListener("message", listener);
          clearInterval(checkInterval);

          onSuccess?.();
          setIsLoading(false);
        }
      };

      window.addEventListener("message", listener);

      // Also check periodically if popup was closed manually
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          window.removeEventListener("message", listener);
          setIsLoading(false);
        }
      }, 500);

      // Cleanup interval after 5 minutes
      setTimeout(
        () => {
          clearInterval(checkInterval);
        },
        5 * 60 * 1000,
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      console.error("Failed to connect app:", err);
      setIsLoading(false);
    }
  };

  return {
    connect,
    isLoading,
  };
}
