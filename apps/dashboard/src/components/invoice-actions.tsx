"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
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
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
  status: string;
  id: string;
};

export function InvoiceActions({ status, id }: Props) {
  const trpc = useTRPC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setParams } = useInvoiceParams();

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

  const handleDeleteInvoice = () => {
    deleteInvoiceMutation.mutate({ id });
    setParams(null);
  };

  switch (status) {
    case "canceled":
    case "paid":
      return (
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
              <DropdownMenuItem
                onClick={() =>
                  updateInvoiceMutation.mutate({
                    id,
                    status: "unpaid",
                    paid_at: null,
                  })
                }
              >
                Mark as unpaid
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDeleteInvoice}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );

    case "overdue":
    case "unpaid":
      return (
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
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <Calendar
                      mode="single"
                      toDate={new Date()}
                      selected={new Date()}
                      onSelect={(date) => {
                        if (date) {
                          updateInvoiceMutation.mutate({
                            id,
                            status: "paid",
                            paid_at: date.toISOString(),
                          });
                        } else {
                          // NOTE: Today is undefined
                          updateInvoiceMutation.mutate({
                            id,
                            status: "paid",
                            paid_at: new Date().toISOString(),
                          });
                        }
                      }}
                      initialFocus
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    case "draft":
      return (
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    default:
      return null;
  }
}
