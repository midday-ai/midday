import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";

type Props = {
  status: string;
  id: string;
};

export function InvoiceActions({ status, id }: Props) {
  switch (status) {
    case "overdue":
    case "unpaid":
      return (
        <div className="flex space-x-2 mt-8">
          <Button
            size="sm"
            variant="secondary"
            className="flex items-center space-x-2 hover:bg-secondary w-full"
          >
            <Icons.Notifications className="size-3.5" />
            <span>Remind</span>
          </Button>
          {/* <Button
            size="sm"
            variant="secondary"
            className="flex items-center space-x-2 hover:bg-secondary w-full"
          >
            <Icons.Edit className="size-3.5" />
            <span>Edit invoice</span>
          </Button> */}

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
              <DropdownMenuItem>Mark as paid</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Cancel invoice
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
          >
            <Icons.Notifications className="size-3.5" />
            <span>Remind</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex items-center space-x-2 hover:bg-secondary w-full"
          >
            <Icons.Edit className="size-3.5" />
            <span>Edit invoice</span>
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
              <DropdownMenuItem>Mark as paid</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
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
