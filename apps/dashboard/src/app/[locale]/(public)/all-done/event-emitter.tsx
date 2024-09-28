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
      window.opener.postMessage(event, "*");
    }
  }, [event]);

  return null;
};
