"use client";

import { deleteInviteAction } from "@/actions/delete-invite-action";
import { InviteTeamMembersModal } from "@/components/modals/invite-team-members-modal";
import { useI18n } from "@/locales/client";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Dialog } from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Input } from "@midday/ui/input";
import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import * as React from "react";

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    id: "member",
    accessorKey: "user.full_name",
    header: () => "Select all",
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-4">
          <Avatar className="rounded-full w-8 h-8">
            <AvatarFallback>
              <span className="text-xs">P</span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Pending Invitation</span>
            <span className="text-sm text-[#606060]">{row.original.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const t = useI18n();
      const { toast } = useToast();

      const deleteInvite = useAction(deleteInviteAction, {
        onSuccess: () => {
          toast({
            title: "Team invite removed.",
            duration: 3500,
            variant: "success",
          });
        },
        onError: () => {
          toast({
            duration: 3500,
            variant: "error",
            title: "Something went wrong please try again.",
          });
        },
      });

      return (
        <div className="flex justify-end">
          <div className="flex space-x-2 items-center">
            <span className="text-[#606060]">
              {t(`roles.${row.original.role}`)}
            </span>
            {table.options.meta.currentUser.role === "owner" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() =>
                      deleteInvite.execute({
                        id: row.original.id,
                        revalidatePath: "settings/members",
                      })
                    }
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      );
    },
    meta: {
      className: "text-right",
    },
  },
];

export function PendingInvitesSkeleton() {
  return (
    <div className="w-full">
      <DataTableHeader />

      <Table>
        <TableBody>
          {[...Array(6)].map((_, index) => (
            <TableRow key={index.toString()} className="hover:bg-transparent">
              <TableCell className="border-r-[0px] py-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="rounded-full w-8 h-8" />

                  <div className="flex flex-col space-y-2">
                    <Skeleton className="w-[200px] h-3" />
                    <Skeleton className="w-[150px] h-2" />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DataTableHeader({ table }) {
  const [isOpen, onOpenChange] = React.useState(false);

  return (
    <div className="flex items-center pb-4 space-x-4">
      <Input
        className="flex-1"
        placeholder="Search..."
        value={(table?.getColumn("member")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table?.getColumn("member")?.setFilterValue(event.target.value)
        }
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <Button onClick={() => onOpenChange(true)}>Invite member</Button>
        <InviteTeamMembersModal onOpenChange={onOpenChange} isOpen={isOpen} />
      </Dialog>
    </div>
  );
}

export function DataTable({ data, currentUser }) {
  const table = useReactTable({
    getRowId: (row) => row.id,
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      currentUser,
    },
  });

  return (
    <div className="w-full">
      <DataTableHeader table={table} />

      <Table>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-transparent"
              >
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "border-r-[0px] py-4",
                      cell.column.columnDef.meta?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-[360px] text-center"
              >
                <h2 className="font-medium mb-1">
                  No Pending Invitations Found
                </h2>
                <span className="text-[#606060]">
                  Use the button above to invite a Team Member.
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
