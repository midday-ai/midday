"use client";

import { useEffect } from "react";

export function ConnectorCallbackEmitter({
  status,
}: {
  status: string | undefined;
}) {
  useEffect(() => {
    if (status !== "success") return;

    const message = "connector_oauth_completed";

    if (window?.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(message, "*");
      } catch {
        // Ignore cross-origin errors
      }
    }

    const timeout = setTimeout(() => {
      if (window?.opener && !window.opener.closed) {
        window.opener.postMessage(message, "*");
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [status]);

  return null;
}
