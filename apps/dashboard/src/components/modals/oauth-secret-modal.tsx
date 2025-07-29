"use client";

import { useOAuthSecretModalStore } from "@/store/oauth-secret-modal";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Label } from "@midday/ui/label";
import { CopyInput } from "../copy-input";

export function OAuthSecretModal() {
  const { isOpen, clientSecret, applicationName, close } =
    useOAuthSecretModalStore();

  return (
    <Dialog open={isOpen} onOpenChange={() => close()}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>OAuth Application Created</DialogTitle>
            <DialogDescription>
              Your OAuth application "{applicationName}" has been created
              successfully. For security reasons, the client secret will only be
              shown once. Please copy and store it in a secure location.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-1 block">
                Client Secret
              </Label>
              <CopyInput value={clientSecret || ""} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={close} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
