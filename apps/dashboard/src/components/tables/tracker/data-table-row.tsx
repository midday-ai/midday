"use client";

import { deleteProjectAction } from "@/actions/project/delete-project-action";
import { TrackerExportCSV } from "@/components/tracker-export-csv";
import { TrackerStatus } from "@/components/tracker-status";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserContext } from "@/store/user/hook";
import { formatAmount, secondsToHoursAndMinutes } from "@/utils/format";
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
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Badge } from "@midday/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { ScrollArea, ScrollBar } from "@midday/ui/scroll-area";
import { TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import type { TrackerProject } from "./data-table";

type DataTableCellProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function DataTableCell({
  children,
  className,
  onClick,
}: DataTableCellProps) {
  return (
    <TableCell className={className} onClick={onClick}>
      {children}
    </TableCell>
  );
}

type RowProps = {
  children: React.ReactNode;
};

export function Row({ children }: RowProps) {
  return <TableRow className="h-[45px]">{children}</TableRow>;
}

type DataTableRowProps = {
  row: TrackerProject;
  userId: string;
};

export function DataTableRow({ row, userId }: DataTableRowProps) {
  const { toast } = useToast();
  const { setParams } = useTrackerParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { locale } = useUserContext((state) => state.data);

  const deleteAction = useAction(deleteProjectAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const onClick = () => {
    setParams({
      projectId: row.id,
      update: true,
    });
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <Row>
          <DataTableCell onClick={onClick} className="cursor-pointer">
            {row.name}
          </DataTableCell>
          <DataTableCell onClick={onClick} className="cursor-pointer">
            {row.customer ? (
              <div className="flex items-center space-x-2">
                <Avatar className="size-5">
                  {row.customer?.website && (
                    <AvatarImageNext
                      src={`https://img.logo.dev/${row.customer?.website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=60`}
                      alt={`${row.customer?.name} logo`}
                      width={20}
                      height={20}
                      quality={100}
                    />
                  )}
                  <AvatarFallback className="text-[9px] font-medium">
                    {row.customer?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{row.customer?.name}</span>
              </div>
            ) : (
              "-"
            )}
          </DataTableCell>

          <DataTableCell onClick={onClick} className="cursor-pointer">
            <span className="text-sm">
              {row.estimate
                ? `${secondsToHoursAndMinutes(row.total_duration)} / ${secondsToHoursAndMinutes(row.estimate * 3600)}`
                : secondsToHoursAndMinutes(row?.total_duration)}
            </span>
          </DataTableCell>
          <DataTableCell onClick={onClick} className="cursor-pointer">
            <span className="text-sm">
              {formatAmount({
                currency: row.currency,
                amount: row.total_amount,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                locale,
              })}
            </span>
          </DataTableCell>
          <DataTableCell onClick={onClick} className="cursor-pointer">
            {row.description}
          </DataTableCell>
          <DataTableCell>
            <div className="relative">
              <ScrollArea className="w-[170px] whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {row.tags?.map((tag) => (
                    <Link
                      href={`/transactions?tags=${tag.tag.id}`}
                      key={tag.id}
                    >
                      <Badge variant="tag" className="whitespace-nowrap">
                        {tag.tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>

                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            </div>
          </DataTableCell>
          <DataTableCell onClick={onClick} className="cursor-pointer">
            <div className="flex items-center space-x-2">
              {row.users?.map((user) => (
                <Avatar key={user.user_id} className="size-4">
                  <AvatarImageNext
                    src={user.avatar_url}
                    alt={user.full_name ?? ""}
                    width={20}
                    height={20}
                  />
                  <AvatarFallback className="text-[10px]">
                    {user.full_name?.slice(0, 1)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </DataTableCell>
          <DataTableCell onClick={onClick} className="cursor-pointer">
            <div className="flex justify-between items-center">
              <TrackerStatus status={row.status} />

              <DropdownMenuTrigger>
                <Icons.MoreHoriz />
              </DropdownMenuTrigger>
            </div>
          </DataTableCell>
        </Row>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAction.execute({ id: row.id })}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

        <DropdownMenuContent className="w-42" sideOffset={10} align="end">
          <DropdownMenuItem
            onClick={() => setParams({ update: true, projectId: row.id })}
          >
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              setInvoiceParams({
                selectedCustomerId: row.customer?.id,
                type: "create",
                currency: row.currency,
                lineItems: [
                  {
                    name: row.name,
                    price: row.rate ?? 0,
                    quantity: 1,
                  },
                ],
              })
            }
          >
            Create invoice
          </DropdownMenuItem>

          <TrackerExportCSV
            name={row.name}
            projectId={row.id}
            teamId={row.team_id}
            userId={userId}
          />

          <DropdownMenuSeparator />

          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
    </AlertDialog>
  );
}
