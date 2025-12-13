"use client";

import { useEffect } from "react";
import type { WindowEvent } from "./schema";

type Props = {
  event: WindowEvent;
};

const CHANNEL_NAME = "midday_oauth_complete";

export const EventEmitter = ({ event }: Props) => {
  useEffect(() => {
    if (!event) {
      return;
    }

    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(event);
    } catch {
      // BroadcastChannel not supported, fallback to window.opener
    }

    // Fallback to window.opener if available
    if (window?.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(event, "*");
      } catch {
        // Ignore errors
      }
    }

    // Retry once after a short delay to ensure message is received
    const timeout = setTimeout(() => {
      channel?.postMessage(event);
      if (window?.opener && !window.opener.closed) {
        window.opener.postMessage(event, "*");
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      channel?.close();
    };
  }, [event]);

  return null;
};
