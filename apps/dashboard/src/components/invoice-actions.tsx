import { deleteInvoiceAction } from "@/actions/invoice/delete-invoice-action";
import { sendReminderAction } from "@/actions/invoice/send-reminder-action";
import { updateInvoiceAction } from "@/actions/invoice/update-invoice-action";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { UTCDate } from "@date-fns/utc";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useAction } from "next-safe-action/hooks";

type Props = {
  status: string;
  id: string;
};

export function InvoiceActions({ status, id }: Props) {
  const { setParams } = useInvoiceParams();
  const updateInvoice = useAction(updateInvoiceAction);
  const deleteInvoice = useAction(deleteInvoiceAction);
  const sendReminder = useAction(sendReminderAction);

  const handleDeleteInvoice = () => {
    deleteInvoice.execute({ id });
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
                size="sm"
                variant="secondary"
                className="hover:bg-secondary"
              >
                <Icons.MoreHoriz className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={10} align="end">
              <DropdownMenuItem
                onClick={() =>
                  updateInvoice.execute({
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
                  onClick={() => sendReminder.execute({ id })}
                  disabled={sendReminder.isPending}
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
              <DropdownMenuItem
                onClick={() =>
                  updateInvoice.execute({
                    id,
                    status: "paid",
                    paid_at: new UTCDate().toISOString(),
                  })
                }
              >
                Mark as paid
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDeleteInvoice}
              >
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  updateInvoice.execute({ id, status: "canceled" })
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
