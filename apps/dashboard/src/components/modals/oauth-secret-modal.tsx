"use client";

import { useI18n } from "@/locales/client";
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
  const t = useI18n();
  const { isOpen, clientSecret, applicationName, close } =
    useOAuthSecretModalStore();

  return (
    <Dialog open={isOpen} onOpenChange={() => close()}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>{t("modals.oauth_secret.title")}</DialogTitle>
            <DialogDescription>
              {t("modals.oauth_secret.description", { name: applicationName })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-1 block">
                {t("modals.oauth_secret.client_secret")}
              </Label>
              <CopyInput value={clientSecret || ""} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={close} className="w-full">
              {t("forms.buttons.done")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
