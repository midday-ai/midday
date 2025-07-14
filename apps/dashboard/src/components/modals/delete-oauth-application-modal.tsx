"use client";

import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
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
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the OAuth
            application <strong>&quot;{applicationName}&quot;</strong> and all
            associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">What will happen:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• All active OAuth tokens will be revoked immediately</li>
              <li>• Applications using this OAuth app will stop working</li>
              <li>• All authorization codes will be invalidated</li>
              <li>• Client credentials will be permanently deleted</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-medium">DELETE</span> to confirm.
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              deleteApplicationMutation.mutate({
                id: applicationId,
              })
            }
            disabled={value !== "DELETE" || deleteApplicationMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteApplicationMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete OAuth Application"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
