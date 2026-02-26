"use client";

import { useFileUrl } from "@/hooks/use-file-url";
import { useDealParams } from "@/hooks/use-deal-params";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
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

type Props = {
  status: string;
  id: string;
  dealNumber?: string | null;
  dealRecurringId?: string | null;
  recurringStatus?: string | null;
  paymentIntentId?: string | null;
};

export function DealActions({
  status,
  id,
  dealNumber,
  dealRecurringId,
  recurringStatus,
  paymentIntentId,
}: Props) {
  const trpc = useTRPC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setParams } = useDealParams();
  const { data: user } = useUserQuery();
  const [cancelSeriesOpen, setCancelSeriesOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const canCancelSeries =
    dealRecurringId &&
    (recurringStatus === "active" || recurringStatus === "paused");
  const canPauseSeries = dealRecurringId && recurringStatus === "active";
  const canResumeSeries = dealRecurringId && recurringStatus === "paused";
  const canEditSeries =
    dealRecurringId &&
    (recurringStatus === "active" || recurringStatus === "paused");
  const canRefund = status === "paid" && paymentIntentId;
  const canDownloadReceipt = status === "paid";

  const { url: receiptUrl } = useFileUrl(
    canDownloadReceipt && user?.fileKey
      ? { type: "deal", dealId: id, isReceipt: true }
      : null,
  );

  const updateDealMutation = useMutation(
    trpc.deal.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.dealSummary.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.paymentStatus.queryKey(),
        });
      },
    }),
  );

  const deleteDealMutation = useMutation(
    trpc.deal.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        // Widget uses regular query
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.dealSummary.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.paymentStatus.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.defaultSettings.queryKey(),
        });
      },
    }),
  );

  const sendReminderMutation = useMutation(
    trpc.deal.remind.mutationOptions({
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
    trpc.dealRecurring.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.list.queryKey(),
        });
      },
    }),
  );

  const refundMutation = useMutation(
    trpc.dealPayments.refundPayment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey({ id }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.deal.dealSummary.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.deal.paymentStatus.queryKey(),
        });
      },
    }),
  );

  const pauseSeriesMutation = useMutation(
    trpc.dealRecurring.pause.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.list.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.getUpcoming.queryKey(),
        });
      },
    }),
  );

  const resumeSeriesMutation = useMutation(
    trpc.dealRecurring.resume.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.list.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.getUpcoming.queryKey(),
        });
      },
    }),
  );

  const handleDeleteDeal = () => {
    deleteDealMutation.mutate({ id });
    setParams(null);
  };

  const cancelSeriesDialog = (
    <AlertDialog open={cancelSeriesOpen} onOpenChange={setCancelSeriesOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel recurring series</AlertDialogTitle>
          <AlertDialogDescription>
            This will stop all future deals in this recurring series.
            Deals that have already been sent will not be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep series</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (dealRecurringId) {
                cancelSeriesMutation.mutate({ id: dealRecurringId });
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
            This will issue a full refund for this deal. The deal status
            will be changed to refunded. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => refundMutation.mutate({ dealId: id })}
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
                          `receipt-${dealNumber || "deal"}.pdf`,
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
                    updateDealMutation.mutate({
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
                  onClick={handleDeleteDeal}
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
                          setParams({ editRecurringId: dealRecurringId })
                        }
                      >
                        Edit series
                      </DropdownMenuItem>
                    )}
                    {canPauseSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (dealRecurringId) {
                            pauseSeriesMutation.mutate({
                              id: dealRecurringId,
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
                          if (dealRecurringId) {
                            resumeSeriesMutation.mutate({
                              id: dealRecurringId,
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
                    Are you sure you want to send a reminder for this deal?
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
              onClick={() => setParams({ dealId: id, type: "edit" })}
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
                          updateDealMutation.mutate({
                            id,
                            status: "paid",
                            paidAt: date.toISOString(),
                          });
                        } else {
                          // NOTE: Today is undefined
                          updateDealMutation.mutate({
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
                  onClick={handleDeleteDeal}
                >
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    updateDealMutation.mutate({
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
                          setParams({ editRecurringId: dealRecurringId })
                        }
                      >
                        Edit series
                      </DropdownMenuItem>
                    )}
                    {canPauseSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (dealRecurringId) {
                            pauseSeriesMutation.mutate({
                              id: dealRecurringId,
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
                          if (dealRecurringId) {
                            resumeSeriesMutation.mutate({
                              id: dealRecurringId,
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
              onClick={() => setParams({ dealId: id, type: "edit" })}
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
                  onClick={handleDeleteDeal}
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
                          setParams({ editRecurringId: dealRecurringId })
                        }
                      >
                        Edit series
                      </DropdownMenuItem>
                    )}
                    {canPauseSeries && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (dealRecurringId) {
                            pauseSeriesMutation.mutate({
                              id: dealRecurringId,
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
                          if (dealRecurringId) {
                            resumeSeriesMutation.mutate({
                              id: dealRecurringId,
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
