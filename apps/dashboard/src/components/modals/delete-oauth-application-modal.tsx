"use client";

import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  applicationId: string;
  applicationName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteOAuthApplicationModal({
  applicationId,
  applicationName,
  isOpen,
  onOpenChange,
}: Props) {
  const t = useI18n();
  const [value, setValue] = useState("");
  const { setParams } = useOAuthApplicationParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteApplicationMutation = useMutation(
    trpc.oauthApplications.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.list.queryKey(),
        });
        onOpenChange(false);
        setParams(null);
        setValue("");
      },
    }),
  );

  const handleClose = () => {
    onOpenChange(false);
    setValue("");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("modals.delete_oauth.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("modals.delete_oauth.description", { name: applicationName })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-muted">
            <h4 className="font-medium mb-2">{t("modals.common.what_will_happen")}</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• {t("modals.delete_oauth.consequences.tokens_revoked")}</li>
              <li>• {t("modals.delete_oauth.consequences.apps_stop_working")}</li>
              <li>• {t("modals.delete_oauth.consequences.codes_invalidated")}</li>
              <li>• {t("modals.delete_oauth.consequences.credentials_deleted")}</li>
              <li>• {t("modals.delete_oauth.consequences.cannot_undo")}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              {t("modals.delete_oauth.type_delete")}
            </Label>
            <Input
              id="confirm-delete"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="DELETE"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("forms.buttons.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              deleteApplicationMutation.mutate({
                id: applicationId,
              })
            }
            disabled={value !== "DELETE" || deleteApplicationMutation.isPending}
            className="bg-destructive hover:bg-destructive"
          >
            {deleteApplicationMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("forms.buttons.delete")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
