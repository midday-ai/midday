"use client";

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
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  id: string;
  filePath: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteVaultFileDialog({
  id,
  filePath,
  isOpen,
  onOpenChange,
}: Props) {
  const t = useI18n();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if document has transaction attachments
  const { data: attachmentData, isLoading: isCheckingAttachments } = useQuery(
    trpc.documents.checkAttachments.queryOptions(
      { id },
      {
        enabled: isOpen, // Only run when dialog is open
      },
    ),
  );

  const deleteDocumentMutation = useMutation(
    trpc.documents.delete.mutationOptions({
      onMutate: () => {
        setIsDeleting(true);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        onOpenChange(false);
      },
      onError: () => {
        setIsDeleting(false);
      },
      onSettled: () => {
        setIsDeleting(false);
      },
    }),
  );

  const handleDelete = () => {
    deleteDocumentMutation.mutate({ id });
  };

  const hasAttachments = attachmentData?.hasAttachments ?? false;
  const attachmentCount = attachmentData?.attachments?.length ?? 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-sm">
            {t("tables.delete_file.title")}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {hasAttachments ? (
              <div className="space-y-3">
                <p>{t("tables.delete_file.description_vault")}</p>
                <div className="my-6 px-3 py-3 bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                        {t("tables.delete_file.attached_to", { count: attachmentCount })}
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        {t("tables.delete_file.will_remove")}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tables.delete_file.continue_question")}
                </p>
              </div>
            ) : (
              <div>
                <p>{t("tables.delete_file.description_vault")}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("modals.common.cannot_be_undone")}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("forms.buttons.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t("tables.delete_file.deleting")}
              </div>
            ) : (
              t("tables.delete_file.title")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
