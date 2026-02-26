"use client";

import { OpenURL } from "@/components/open-url";
import { useFileUrl } from "@/hooks/use-file-url";
import { useDealParams } from "@/hooks/use-deal-params";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
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
import { useToast } from "@midday/ui/use-toast";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
import type { Deal } from "./columns";

type Props = {
  row: Deal;
};

export function ActionsMenu({ row }: Props) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();
  const { setParams } = useDealParams();
  const { toast } = useToast();
  const [, copy] = useCopyToClipboard();
  const [cancelSeriesOpen, setCancelSeriesOpen] = useState(false);

  const canDownloadReceipt = row.status === "paid";
  const { url: receiptUrl } = useFileUrl(
    canDownloadReceipt && user?.fileKey
      ? { type: "deal", dealId: row.id, isReceipt: true }
      : null,
  );

  const canCancelSeries =
    row.dealRecurringId &&
    (row.recurring?.status === "active" || row.recurring?.status === "paused");
  const canPauseSeries =
    row.dealRecurringId && row.recurring?.status === "active";
  const canResumeSeries =
    row.dealRecurringId && row.recurring?.status === "paused";
  const canEditSeries =
    row.dealRecurringId &&
    (row.recurring?.status === "active" || row.recurring?.status === "paused");

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

  const updateDealMutation = useMutation(
    trpc.deal.update.mutationOptions({
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
      },
    }),
  );

  const duplicateDealMutation = useMutation(
    trpc.deal.duplicate.mutationOptions({
      onSuccess: (data) => {
        if (data) {
          setParams({
            dealId: data.id,
            type: "edit",
          });
        }

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.queryKey(),
        });
      },
    }),
  );

  const cancelScheduleMutation = useMutation(
    trpc.deal.cancelSchedule.mutationOptions({
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
      },
    }),
  );

  const cancelSeriesMutation = useMutation(
    trpc.dealRecurring.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.list.queryKey(),
        });
      },
    }),
  );

  const pauseSeriesMutation = useMutation(
    trpc.dealRecurring.pause.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.list.queryKey(),
        });
      },
    }),
  );

  const resumeSeriesMutation = useMutation(
    trpc.dealRecurring.resume.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.list.queryKey(),
        });
      },
    }),
  );

  const handleCopyLink = async () => {
    copy(`${getUrl()}/i/${row.token}`);

    toast({
      duration: 4000,
      title: "Copied link to clipboard.",
      variant: "success",
    });
  };

  return (
    <div className="flex items-center justify-center w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="relative">
          <Button variant="ghost" className="h-8 w-8 p-0">
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {row.status !== "paid" && row.status !== "canceled" && (
            <DropdownMenuItem
              onClick={() =>
                setParams({
                  dealId: row.id,
                  type: "edit",
                })
              }
            >
              Edit deal
            </DropdownMenuItem>
          )}

          <DropdownMenuItem>
            <OpenURL href={`${getUrl()}/i/${row.token}`}>Open deal</OpenURL>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyLink}>
            Copy link
          </DropdownMenuItem>

          {row.status !== "draft" && (
            <DropdownMenuItem
              onClick={() => {
                if (!user?.fileKey) {
                  console.error("File key not available");
                  return;
                }
                const url = new URL(
                  `${process.env.NEXT_PUBLIC_API_URL}/files/download/deal`,
                );
                url.searchParams.set("id", row.id);
                url.searchParams.set("fk", user.fileKey);
                downloadFile(
                  url.toString(),
                  `${row.dealNumber || "deal"}.pdf`,
                );
              }}
            >
              Download
            </DropdownMenuItem>
          )}

          {canDownloadReceipt && receiptUrl && (
            <DropdownMenuItem
              onClick={() => {
                downloadFile(
                  receiptUrl,
                  `receipt-${row.dealNumber || "deal"}.pdf`,
                );
              }}
            >
              Download receipt
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => duplicateDealMutation.mutate({ id: row.id })}
          >
            Duplicate
          </DropdownMenuItem>

          {row.status === "scheduled" && row.scheduledJobId && (
            <DropdownMenuItem
              onClick={() => cancelScheduleMutation.mutate({ id: row.id })}
              className="text-[#FF3638]"
            >
              Cancel schedule
            </DropdownMenuItem>
          )}

          {row.status === "paid" && (
            <DropdownMenuItem
              onClick={() =>
                updateDealMutation.mutate({
                  id: row.id,
                  status: "unpaid",
                  paidAt: null,
                })
              }
            >
              Mark as unpaid
            </DropdownMenuItem>
          )}

          {(row.status === "overdue" || row.status === "unpaid") && (
            <>
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
                          id: row.id,
                          status: "paid",
                          paidAt: date.toISOString(),
                        });
                      } else {
                        // NOTE: Today is undefined
                        updateDealMutation.mutate({
                          id: row.id,
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
                onClick={() =>
                  updateDealMutation.mutate({
                    id: row.id,
                    status: "canceled",
                  })
                }
                className="text-[#FF3638]"
              >
                Cancel
              </DropdownMenuItem>
            </>
          )}

          {row.status === "canceled" && (
            <DropdownMenuItem
              onClick={() => deleteDealMutation.mutate({ id: row.id })}
              className="text-[#FF3638]"
            >
              Delete
            </DropdownMenuItem>
          )}

          {row.status === "draft" && (
            <DropdownMenuItem
              onClick={() => deleteDealMutation.mutate({ id: row.id })}
              className="text-[#FF3638]"
            >
              Delete
            </DropdownMenuItem>
          )}

          {(canEditSeries ||
            canPauseSeries ||
            canResumeSeries ||
            canCancelSeries) && (
            <>
              <DropdownMenuSeparator />
              {canEditSeries && (
                <DropdownMenuItem
                  onClick={() =>
                    setParams({ editRecurringId: row.dealRecurringId })
                  }
                >
                  Edit series
                </DropdownMenuItem>
              )}
              {canPauseSeries && (
                <DropdownMenuItem
                  onClick={() => {
                    if (row.dealRecurringId) {
                      pauseSeriesMutation.mutate({
                        id: row.dealRecurringId,
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
                    if (row.dealRecurringId) {
                      resumeSeriesMutation.mutate({
                        id: row.dealRecurringId,
                      });
                    }
                  }}
                >
                  Resume series
                </DropdownMenuItem>
              )}
              {canCancelSeries && (
                <DropdownMenuItem
                  onClick={() => setCancelSeriesOpen(true)}
                  className="text-[#FF3638]"
                >
                  Cancel series
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
                if (row.dealRecurringId) {
                  cancelSeriesMutation.mutate({ id: row.dealRecurringId });
                }
              }}
            >
              Cancel series
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
