"use client";

import { useCallback } from "react";

export function useConnectDialogReset(deps: {
  setOpen: (value: boolean) => void;
  setLinkCode: (value: string) => void;
  setQrCodeUrl: (value: string) => void;
  setCopied: (value: boolean) => void;
  resetMutation: () => void;
}) {
  return useCallback(
    (open: boolean) => {
      deps.setOpen(open);
      if (!open) {
        deps.setLinkCode("");
        deps.setQrCodeUrl("");
        deps.setCopied(false);
        deps.resetMutation();
      }
    },
    [
      deps.setOpen,
      deps.setLinkCode,
      deps.setQrCodeUrl,
      deps.setCopied,
      deps.resetMutation,
    ],
  );
}
