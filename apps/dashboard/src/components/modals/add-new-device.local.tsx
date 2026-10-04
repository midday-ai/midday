"use client";

import { authClient } from "@midday/auth/client";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@midday/ui/dialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EnrollMFA } from "../enroll-mfa";

export function LocalAddNewDeviceModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = searchParams.get("add") === "device";
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isOpen) {
      setStarted(false);
      setEnabled(null);
      return;
    }
    let active = true;
    void authClient
      .getSession({ query: { disableCookieCache: true } })
      .then((result) => {
        if (!active) return;
        if (result.error || !result.data)
          setError("Could not load your security settings.");
        else setEnabled(!!result.data.user.twoFactorEnabled);
      })
      .catch(() => {
        if (active) setError("Could not load your security settings.");
      });
    return () => {
      active = false;
    };
  }, [isOpen]);
  const close = () => {
    router.replace(pathname);
    router.refresh();
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !started) close();
      }}
    >
      <DialogContent
        className="max-w-[455px]"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          if (started) event.preventDefault();
        }}
      >
        <DialogTitle>
          {enabled ? "Replace authenticator" : "Enable MFA"}
        </DialogTitle>
        <DialogDescription>
          {enabled
            ? "Replacing your authenticator removes the current one. Complete setup to protect your account again."
            : "Protect your account with an authenticator app and backup codes."}
        </DialogDescription>
        {started ? (
          <EnrollMFA replace={!!enabled} onDone={close} onCancel={close} />
        ) : (
          <div className="space-y-4">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              className="w-full"
              disabled={enabled === null}
              onClick={() => setStarted(true)}
            >
              {enabled ? "Replace authenticator" : "Generate QR"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
