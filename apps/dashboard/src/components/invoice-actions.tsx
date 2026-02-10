"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useFileUrl } from "@/hooks/use-file-url";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";

type Props = {
  status: string;
  id: string;
  invoiceNumber?: string | null;
  invoiceRecurringId?: string | null;
  recurringStatus?: string | null;
  paymentIntentId?: string | null;
};

export function InvoiceActions({
  status,
  id,
  invoiceNumber,
  invoiceRecurringId,
  recurringStatus,
  paymentIntentId,
}: Props) {
  const trpc = useTRPC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setParams } = useInvoiceParams();
  const { data: user } = useUserQuery();
  const [cancelSeriesOpen, setCancelSeriesOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const canCancelSeries =
    invoiceRecurringId &&
    (recurringStatus === "active" || recurringStatus === "paused");
  const canPauseSeries = invoiceRecurringId && recurringStatus === "active";
  const canResumeSeries = invoiceRecurringId && recurringStatus === "paused";
  const canEditSeries =
    invoiceRecurringId &&
    (recurringStatus === "active" || recurringStatus === "paused");
  const canRefund = status === "paid" && paymentIntentId;
  const canDownloadReceipt = status === "paid";

  const { url: receiptUrl } = useFileUrl(
    canDownloadReceipt && user?.fileKey
      ? { type: "invoice", invoiceId: id, isReceipt: true }
      : null,
  );

  const updateInvoiceMutation = useMutation(
    trpc.invoice.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.paymentStatus.queryKey(),
        });
      },
    }),
  );

  const deleteInvoiceMutation = useMutation(
    trpc.invoice.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        // Widget uses regular query
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.paymentStatus.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.defaultSettings.queryKey(),
        });
      },
    }),
  );

  const sendReminderMutation = useMutation(
    trpc.invoice.remind.mutationOptions({
      onSuccess: () => {
        toast({
          duration: 2500,
          title: "Reminder sent",
          variant: "success",
        });
      },
    }),
  );

  const cancelSeriesMutation = useMutation(
    trpc.invoiceRecurring.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.list.queryKey(),
        });
      },
    }),
  );

  const refundMutation = useMutation(
    trpc.invoicePayments.refundPayment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey({ id }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.paymentStatus.queryKey(),
        });
      },
    }),
  );

  const pauseSeriesMutation = useMutation(
    trpc.invoiceRecurring.pause.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.list.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.getUpcoming.queryKey(),
        });
      },
    }),
  );

  const resumeSeriesMutation = useMutation(
    trpc.invoiceRecurring.resume.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.list.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.getUpcoming.queryKey(),
        });
      },
    }),
  );

  const handleDeleteInvoice = () => {
    deleteInvoiceMutation.mutate({ id });
    setParams(null);
  };

  const cancelSeriesDialog = (
    <AlertDialog open={cancelSeriesOpen} onOpenChange={setCancelSeriesOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel recurring series</AlertDialogTitle>
          <AlertDialogDescription>
            This will stop all future invoices in this recurring series.
            Invoices that have already been sent will not be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep series</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (invoiceRecurringId) {
                cancelSeriesMutation.mutate({ id: invoiceRecurringId });
              }
            }}
          >
            Cancel series
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const refundDialog = (
    <AlertDialog open={refundOpen} onOpenChange={setRefundOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Refund payment</AlertDialogTitle>
          <AlertDialogDescription>
            This will issue a full refund for this invoice. The invoice status
            will be changed to refunded. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => refundMutation.mutate({ invoiceId: id })}
          >
            Refund
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  switch (status) {
    case "canceled":
    case "paid":
      return (
        <>
          <div className="absolute right-4 mt-7">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="hover:bg-secondary"
                >
                  <Icons.MoreHoriz className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={10} align="end">
                {canDownloadReceipt && receiptUrl && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        downloadFile(
                          receiptUrl,
                          `receipt-${invoiceNumber || "invoice"}.pdf`,
                        );
                      }}
                    >
                      Download receipt
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    updateInvoiceMutation.mutate({
                      id,
                      status: "unpaid",
                      paidAt: null,
                    })
                  }
                >
                  Mark as unpaid
                </DropdownMenuItem>
                {canRefund && (
                  <DropdownMenuItem onClick={() => setRefundOpen(true)}>
                    Refund payment
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteInvoice}
                >
                  Delete
                </DropdownMenuItem>
                {(canEditSeries ||
                  canPauseSeries ||
                  canResumeSeries ||
                  canCancelSeries) && (
                  <>
                    <DropdownMenuSeparator />
                    {canEditSeries && (
                      <DropdownMenuItem
                        onClick={() =>
                          setParams({ editRecurringId: invoiceRecurringId })
                        }
                      >
                        Edit series
                      </DropdownMenuItem>
                    )}
                    {canPauseSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (invoiceRecurringId) {
                            pauseSeriesMutation.mutate({
                              id: invoiceRecurringId,
                            });
                          }
                        }}
                      >
                        Pause series
                      </DropdownMenuItem>
                    )}
                    {canResumeSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (invoiceRecurringId) {
                            resumeSeriesMutation.mutate({
                              id: invoiceRecurringId,
                            });
                          }
                        }}
                      >
                        Resume series
                      </DropdownMenuItem>
                    )}
                    {canCancelSeries && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setCancelSeriesOpen(true)}
                      >
                        Cancel series
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {cancelSeriesDialog}
          {refundDialog}
        </>
      );

    case "overdue":
    case "unpaid":
      return (
        <>
          <div className="flex space-x-2 mt-8">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex items-center space-x-2 hover:bg-secondary w-full"
                >
                  <Icons.Notifications className="size-3.5" />
                  <span>Remind</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send Reminder</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to send a reminder for this invoice?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      sendReminderMutation.mutate({
                        id,
                        date: new Date().toISOString(),
                      })
                    }
                    disabled={sendReminderMutation.isPending}
                  >
                    Send Reminder
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              variant="secondary"
              className="flex items-center space-x-2 hover:bg-secondary w-full"
              onClick={() => setParams({ invoiceId: id, type: "edit" })}
            >
              <Icons.Edit className="size-3.5" />
              <span>Edit</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="hover:bg-secondary"
                >
                  <Icons.MoreHoriz className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent sideOffset={10} align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Mark as paid</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <Calendar
                      mode="single"
                      weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
                      toDate={new Date()}
                      selected={new Date()}
                      onSelect={(date) => {
                        if (date) {
                          updateInvoiceMutation.mutate({
                            id,
                            status: "paid",
                            paidAt: date.toISOString(),
                          });
                        } else {
                          // NOTE: Today is undefined
                          updateInvoiceMutation.mutate({
                            id,
                            status: "paid",
                            paidAt: new Date().toISOString(),
                          });
                        }
                      }}
                      initialFocus
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteInvoice}
                >
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    updateInvoiceMutation.mutate({
                      id,
                      status: "canceled",
                    })
                  }
                >
                  Cancel
                </DropdownMenuItem>
                {(canEditSeries ||
                  canPauseSeries ||
                  canResumeSeries ||
                  canCancelSeries) && (
                  <>
                    <DropdownMenuSeparator />
                    {canEditSeries && (
                      <DropdownMenuItem
                        onClick={() =>
                          setParams({ editRecurringId: invoiceRecurringId })
                        }
                      >
                        Edit series
                      </DropdownMenuItem>
                    )}
                    {canPauseSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (invoiceRecurringId) {
                            pauseSeriesMutation.mutate({
                              id: invoiceRecurringId,
                            });
                          }
                        }}
                      >
                        Pause series
                      </DropdownMenuItem>
                    )}
                    {canResumeSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (invoiceRecurringId) {
                            resumeSeriesMutation.mutate({
                              id: invoiceRecurringId,
                            });
                          }
                        }}
                      >
                        Resume series
                      </DropdownMenuItem>
                    )}
                    {canCancelSeries && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setCancelSeriesOpen(true)}
                      >
                        Cancel series
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {cancelSeriesDialog}
        </>
      );
    case "draft":
      return (
        <>
          <div className="flex space-x-2 mt-8">
            <Button
              size="sm"
              variant="secondary"
              className="flex items-center space-x-2 hover:bg-secondary w-full"
              onClick={() => setParams({ invoiceId: id, type: "edit" })}
            >
              <Icons.Edit className="size-3.5" />
              <span>Edit</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="hover:bg-secondary"
                >
                  <Icons.MoreHoriz className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={10} align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteInvoice}
                >
                  Delete draft
                </DropdownMenuItem>
                {(canEditSeries ||
                  canPauseSeries ||
                  canResumeSeries ||
                  canCancelSeries) && (
                  <>
                    <DropdownMenuSeparator />
                    {canEditSeries && (
                      <DropdownMenuItem
                        onClick={() =>
                          setParams({ editRecurringId: invoiceRecurringId })
                        }
                      >
                        Edit series
                      </DropdownMenuItem>
                    )}
                    {canPauseSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (invoiceRecurringId) {
                            pauseSeriesMutation.mutate({
                              id: invoiceRecurringId,
                            });
                          }
                        }}
                      >
                        Pause series
                      </DropdownMenuItem>
                    )}
                    {canResumeSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (invoiceRecurringId) {
                            resumeSeriesMutation.mutate({
                              id: invoiceRecurringId,
                            });
                          }
                        }}
                      >
                        Resume series
                      </DropdownMenuItem>
                    )}
                    {canCancelSeries && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setCancelSeriesOpen(true)}
                      >
                        Cancel series
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {cancelSeriesDialog}
        </>
      );
    default:
      return null;
  }
}
