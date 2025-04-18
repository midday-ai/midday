import { useI18n } from "@/locales/client";
import type { RouterOutputs } from "@/trpc/routers/_app";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import type { ColumnDef, FilterFn, Row, RowData } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Loader2 } from "lucide-react";
import * as React from "react";
import "@tanstack/react-table";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

declare module "@tanstack/react-table" {
  // Define both ColumnMeta and TableMeta interfaces
  interface TableMeta<TData extends RowData> {
    currentUser?: {
      role: "owner" | "member" | null;
      user: {
        id: string;
      };
    };
    totalOwners?: number;
  }

  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

type TeamMember = RouterOutputs["team"]["members"][number];

const userFilterFn: FilterFn<TeamMember> = (
  row: Row<TeamMember>,
  _: string,
  filterValue: string,
) => {
  const memberName = row.original.user?.full_name?.toLowerCase();

  return memberName?.includes(filterValue.toLowerCase()) ?? false;
};

export const columns: ColumnDef<TeamMember>[] = [
  {
    id: "user",
    accessorKey: "user.full_name",
    filterFn: userFilterFn,
    cell: ({ row }) => {
      return (
        <div>
          <div className="flex items-center space-x-4">
            <Avatar className="rounded-full w-8 h-8">
              <AvatarImageNext
                src={row.original.user?.avatar_url ?? ""}
                alt={row.original.user?.full_name ?? ""}
                width={32}
                height={32}
              />
              <AvatarFallback>
                <span className="text-xs">
                  {row.original.user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {row.original.user?.full_name}
              </span>
              <span className="text-sm text-[#606060]">
                {row.original.user?.email}
              </span>
            </div>
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
      const meta = table.options.meta;
      const trpc = useTRPC();
      const queryClient = useQueryClient();

      const deleteMemberMutation = useMutation(
        trpc.team.deleteMember.mutationOptions({
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: trpc.team.members.queryKey(),
            });
          },
          onError: () => {
            toast({
              title: "Error deleting member",
            });
          },
        }),
      );

      const leaveTeamMutation = useMutation(
        trpc.team.leave.mutationOptions({
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: trpc.team.members.queryKey(),
            });
          },
        }),
      );

      const updateMemberMutation = useMutation(
        trpc.team.updateMember.mutationOptions({
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: trpc.team.members.queryKey(),
            });
          },
        }),
      );

      return (
        <div className="flex justify-end">
          <div className="flex space-x-2 items-center">
            {(meta?.currentUser?.role === "owner" &&
              meta?.currentUser?.user?.id !== row.original.user?.id) ||
            (meta?.currentUser?.role === "owner" &&
              (meta?.totalOwners ?? 0) > 1) ? (
              <Select
                value={row.original.role ?? undefined}
                onValueChange={(role) => {
                  updateMemberMutation.mutate({
                    userId: row.original.user?.id,
                    teamId: row.original.team_id,
                    role: role as "owner" | "member",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(`roles.${row.original.role || "member"}`)}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-[#606060]">
                {t(`roles.${row.original.role || "member"}`)}
              </span>
            )}
            {meta?.currentUser?.role === "owner" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {meta?.currentUser?.user?.id !== row.original.user?.id && (
                    <AlertDialog>
                      <DropdownMenuItem
                        className="text-destructive"
                        asDialogTrigger
                      >
                        <AlertDialogTrigger>Remove Member</AlertDialogTrigger>
                      </DropdownMenuItem>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove Team Member
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            You are about to remove the following Team Member,
                            are you sure you want to continue?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={deleteMemberMutation.isPending}
                            onClick={() => {
                              deleteMemberMutation.mutate({
                                userId: row.original.user?.id,
                                teamId: row.original.team_id,
                              });
                            }}
                          >
                            {deleteMemberMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {meta?.currentUser?.user?.id === row.original.user?.id && (
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
                            access at a later time, a Team Owner must invite
                            you.
                            <p className="mt-4">
                              Are you sure you want to continue?
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={leaveTeamMutation.isPending}
                            onClick={() =>
                              leaveTeamMutation.mutate({
                                teamId: row.original.team_id,
                              })
                            }
                          >
                            {leaveTeamMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
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
