"use client";

import { useI18n } from "@/locales/client";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { InviteForm } from "../forms/invite-form";

type InviteTeamMembersModalProps = {
  onOpenChange: (open: boolean) => void;
};

export function InviteTeamMembersModal({
  onOpenChange,
}: InviteTeamMembersModalProps) {
  const t = useI18n();

  return (
    <DialogContent className="max-w-[455px]">
      <div className="p-4">
        <DialogHeader>
          <DialogTitle>{t("modals.invite.title")}</DialogTitle>
          <DialogDescription>
            {t("modals.invite.description")}
          </DialogDescription>
        </DialogHeader>

        <InviteForm onSuccess={() => onOpenChange(false)} skippable={false} />
      </div>
    </DialogContent>
  );
}
