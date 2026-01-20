"use client";

import { ExpenseApprovalStatus } from "@/components/expense-approval-status";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle,
  MoreHorizontal,
  Plus,
  XCircle,
  Wallet,
} from "lucide-react";
import { useState } from "react";

type ExpenseApproval = {
  id: string;
  amount: number;
  currency: string;
  note: string | null;
  status: "draft" | "pending" | "approved" | "rejected" | "paid";
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  requester: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
  approver: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
};

export function ExpenseApprovalsPage() {
  const t = useI18n();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: expenses, isLoading } = useQuery({
    ...trpc.expenseApprovals.list.queryOptions({}),
  });

  const approveMutation = useMutation({
    ...trpc.expenseApprovals.approve.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseApprovals"] });
    },
  });

  const rejectMutation = useMutation({
    ...trpc.expenseApprovals.reject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseApprovals"] });
      setRejectDialogOpen(false);
      setSelectedExpense(null);
      setRejectionReason("");
    },
  });

  const markPaidMutation = useMutation({
    ...trpc.expenseApprovals.markPaid.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseApprovals"] });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id });
  };

  const handleRejectClick = (expense: ExpenseApproval) => {
    setSelectedExpense(expense);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedExpense) {
      rejectMutation.mutate({
        id: selectedExpense.id,
        rejectionReason: rejectionReason || undefined,
      });
    }
  };

  const handleMarkPaid = (id: string) => {
    markPaidMutation.mutate({ id });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: currency || "JPY",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const expenseList = (expenses?.data || []) as ExpenseApproval[];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("expense_approval.page.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("expense_approval.page.description")}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("expense_approval.actions.create")}
        </Button>
      </div>

      {/* Table */}
      {expenseList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t("expense_approval.empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("expense_approval.empty.description")}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("expense_approval.table.amount")}</TableHead>
                <TableHead>{t("expense_approval.table.requester")}</TableHead>
                <TableHead>{t("expense_approval.table.status")}</TableHead>
                <TableHead>{t("expense_approval.table.note")}</TableHead>
                <TableHead>{t("expense_approval.table.submitted_at")}</TableHead>
                <TableHead className="text-right">{t("expense_approval.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseList.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {formatAmount(expense.amount, expense.currency)}
                  </TableCell>
                  <TableCell>
                    {expense.requester?.fullName || expense.requester?.email || "-"}
                  </TableCell>
                  <TableCell>
                    <ExpenseApprovalStatus status={expense.status} />
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.note || "-"}
                  </TableCell>
                  <TableCell>
                    {expense.submittedAt
                      ? format(new Date(expense.submittedAt), "yyyy/MM/dd")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("expense_approval.actions.open_menu")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {expense.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(expense.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t("expense_approval.actions.approve")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRejectClick(expense)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              {t("expense_approval.actions.reject")}
                            </DropdownMenuItem>
                          </>
                        )}
                        {expense.status === "approved" && (
                          <DropdownMenuItem onClick={() => handleMarkPaid(expense.id)}>
                            <Wallet className="h-4 w-4 mr-2" />
                            {t("expense_approval.actions.mark_paid")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("expense_approval.dialogs.reject_title")}</DialogTitle>
            <DialogDescription>
              {t("expense_approval.dialogs.reject_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("expense_approval.dialogs.rejection_reason")}
              </label>
              <Textarea
                placeholder={t("expense_approval.dialogs.rejection_reason_placeholder")}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t("forms.buttons.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending
                ? t("expense_approval.actions.rejecting")
                : t("expense_approval.actions.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
