"use client";

import { useEffect } from "react";
import type { WindowEvent } from "./schema";

type Props = {
  event: WindowEvent;
};

export const EventEmitter = ({ event }: Props) => {
  useEffect(() => {
    if (!window?.opener) {
      return;
    }

    if (event) {
      // Send message to parent window multiple times to ensure it's received
      // Some browsers may miss the first message
      window.opener.postMessage(event, "*");

      // Send again after a short delay as backup
      const timeout = setTimeout(() => {
        window.opener?.postMessage(event, "*");
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [event]);

  return null;
};
