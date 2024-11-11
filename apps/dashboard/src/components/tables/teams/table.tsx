"use client";

import { acceptInviteAction } from "@/actions/accept-invite-action";
import { changeTeamAction } from "@/actions/change-team-action";
import { declineInviteAction } from "@/actions/decline-invite-action";
import { leaveTeamAction } from "@/actions/leave-team-action";
import { CreateTeamModal } from "@/components/modals/create-team-modal";
import { useI18n } from "@/locales/client";
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
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Dialog, DialogTrigger } from "@midday/ui/dialog";
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
import { Loader2 } from "lucide-react";
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
    id: "team",
    accessorKey: "team.name",
    cell: ({ row }) => {
      const t = useI18n();

      return (
        <div className="flex items-center space-x-4">
          <Avatar className="rounded-full w-8 h-8">
            <AvatarImageNext
              src={row.original.team?.logo_url}
              alt={row.original.team?.name ?? ""}
              width={32}
              height={32}
            />
            <AvatarFallback>
              <span className="text-xs">
                {row.original.team.name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {row.original.team.name}
            </span>
            <span className="text-sm text-[#606060]">
              {t(`roles.${row.original.role}`)}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { toast } = useToast();
      const manageTeam = useAction(changeTeamAction);
      const viewTeam = useAction(changeTeamAction);

      const leaveTeam = useAction(leaveTeamAction, {
        onError: () => {
          toast({
            duration: 3500,
            variant: "error",
            title:
              "You cannot leave since you are the only remaining owner of the team. Delete this team instead.",
          });
        },
      });

      const declineInvite = useAction(declineInviteAction);
      const acceptInvite = useAction(acceptInviteAction);

      if (row.original.isInvite) {
        return (
          <div className="flex justify-end">
            <div className="flex space-x-3 items-center">
              <Button
                variant="outline"
                onClick={() =>
                  declineInvite.execute({
                    id: row.original.id,
                    revalidatePath: "/account/teams",
                  })
                }
              >
                Decline
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  acceptInvite.execute({
                    id: row.original.id,
                    revalidatePath: "/account/teams",
                  })
                }
              >
                Accept
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex justify-end">
          <div className="flex space-x-3 items-center">
            <Button
              variant="outline"
              onClick={() =>
                viewTeam.execute({
                  teamId: row.original.team.id,
                  redirectTo: "/",
                })
              }
            >
              View
            </Button>
            {row.original.role === "owner" && (
              <Button
                variant="outline"
                onClick={() =>
                  manageTeam.execute({
                    teamId: row.original.team.id,
                    redirectTo: "/settings",
                  })
                }
              >
                Manage
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <DropdownMenuItem
                    className="text-destructive"
                    asDialogTrigger
                  >
                    <AlertDialogTrigger>Leave Team</AlertDialogTrigger>
                  </DropdownMenuItem>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave Team</AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to leave this team. In order to regain
                        access at a later time, a Team Owner must invite you.
                        <p className="mt-4">
                          Are you sure you want to continue?
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={leaveTeam.status === "executing"}
                        onClick={() =>
                          leaveTeam.execute({
                            teamId: row.original.team.id,
                            role: row.original.role,
                            revalidatePath: "/account/teams",
                          })
                        }
                      >
                        {leaveTeam.status === "executing" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      );
    },
    meta: {
      className: "text-right",
    },
  },
];

export function TeamsSkeleton() {
  return (
    <div className="w-full">
      <DataTableHeader />

      <Table>
        <TableBody>
          {[...Array(6)].map((_, index) => (
            <TableRow key={index.toString()} className="hover:bg-transparent">
              <TableCell className={cn("border-r-[0px] py-4")}>
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <div className="flex items-center pb-4 space-x-4">
        <Input
          className="flex-1"
          placeholder="Search..."
          value={(table?.getColumn("team")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table?.getColumn("team")?.setFilterValue(event.target.value)
          }
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
        <DialogTrigger asChild>
          <Button>Create team</Button>
        </DialogTrigger>
        <CreateTeamModal onOpenChange={onOpenChange} />
      </div>
    </Dialog>
  );
}

export function DataTable({ data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
