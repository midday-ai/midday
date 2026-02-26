"use client";

import type { OAuthErrorCode } from "@midday/app-store/oauth-errors";
import { useEffect } from "react";
import { OAUTH_CHANNEL_NAME, type OAuthMessage } from "@/utils/oauth-message";
import type { OAuthStatus } from "./schema";

type Props = {
  status: OAuthStatus;
  error?: OAuthErrorCode;
};

export const EventEmitter = ({ status, error }: Props) => {
  useEffect(() => {
    if (!status) {
      return;
    }

    const message: OAuthMessage =
      status === "success"
        ? { type: "app_oauth_completed" }
        : { type: "app_oauth_error", error };

    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
      channel.postMessage(message);
    } catch {
      // BroadcastChannel not supported, fallback to window.opener
    }

    // Fallback to window.opener if available
    if (window?.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(message, "*");
      } catch {
        // Ignore errors
      }
    }

    // Retry once after a short delay to ensure message is received
    const timeout = setTimeout(() => {
      channel?.postMessage(message);
      if (window?.opener && !window.opener.closed) {
        window.opener.postMessage(message, "*");
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      channel?.close();
    };
  }, [status, error]);

  return null;
};
