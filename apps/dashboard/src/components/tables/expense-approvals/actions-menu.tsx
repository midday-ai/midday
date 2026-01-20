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
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ExpenseApproval } from "./columns";

interface ActionsMenuProps {
  row: ExpenseApproval;
}

export function ActionsMenu({ row }: ActionsMenuProps) {
  const t = useI18n();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const approveMutation = useMutation(
    trpc.expenseApprovals.approve.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.expenseApprovals.list.queryKey(),
        });
        setShowApproveDialog(false);
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.expenseApprovals.reject.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.expenseApprovals.list.queryKey(),
        });
        setShowRejectDialog(false);
        setRejectionReason("");
      },
    }),
  );

  const markPaidMutation = useMutation(
    trpc.expenseApprovals.markPaid.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.expenseApprovals.list.queryKey(),
        });
      },
    }),
  );

  const handleApprove = () => {
    approveMutation.mutate({ id: row.id });
  };

  const handleReject = () => {
    rejectMutation.mutate({ id: row.id, rejectionReason });
  };

  const handleMarkPaid = () => {
    markPaidMutation.mutate({ id: row.id });
  };

  const isPending = row.status === "pending";
  const isApproved = row.status === "approved";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t("expense_approval.actions.open_menu")}
          >
            <Icons.MoreHoriz className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isPending && (
            <>
              <DropdownMenuItem onClick={() => setShowApproveDialog(true)}>
                <Icons.Check className="mr-2 h-4 w-4" />
                {t("expense_approval.actions.approve")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
                <Icons.Close className="mr-2 h-4 w-4" />
                {t("expense_approval.actions.reject")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {isApproved && (
            <>
              <DropdownMenuItem onClick={handleMarkPaid}>
                <Icons.Check className="mr-2 h-4 w-4" />
                {t("expense_approval.actions.mark_paid")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem>
            <Icons.Description className="mr-2 h-4 w-4" />
            {t("expense_approval.actions.view_details")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("expense_approval.dialogs.approve_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("expense_approval.dialogs.approve_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("forms.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending
                ? t("expense_approval.actions.approving")
                : t("expense_approval.actions.approve")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("expense_approval.dialogs.reject_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("expense_approval.dialogs.reject_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">
              {t("expense_approval.dialogs.rejection_reason")}
            </Label>
            <Input
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t(
                "expense_approval.dialogs.rejection_reason_placeholder",
              )}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("forms.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectMutation.isPending
                ? t("expense_approval.actions.rejecting")
                : t("expense_approval.actions.reject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
