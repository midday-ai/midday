import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
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
import { SubmitButton } from "@midday/ui/submit-button";
import { toast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const teamNameFilterFn: FilterFn<RouterOutputs["team"]["list"][number]> = (
  row: Row<RouterOutputs["team"]["list"][number]>,
  _: string,
  filterValue: string,
) => {
  const teamName = row.original.team?.name?.toLowerCase();

  return teamName?.includes(filterValue.toLowerCase()) ?? false;
};

export const columns: ColumnDef<RouterOutputs["team"]["list"][number]>[] = [
  {
    id: "team",
    accessorKey: "team.name",
    filterFn: teamNameFilterFn,
    cell: ({ row }) => {
      const t = useI18n();

      return (
        <div className="flex items-center space-x-4">
          <Avatar className="rounded-full w-8 h-8">
            <AvatarImageNext
              src={row.original.team?.logoUrl ?? ""}
              alt={row.original.team?.name ?? ""}
              width={32}
              height={32}
            />
            <AvatarFallback>
              <span className="text-xs">
                {row.original.team?.name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {row.original.team?.name}
            </span>
            <span className="text-sm text-[#606060]">
              {/* @ts-expect-error */}
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
      const trpc = useTRPC();
      const queryClient = useQueryClient();
      const router = useRouter();

      const viewTeamMutation = useMutation(
        trpc.user.update.mutationOptions({
          onSuccess: () => {
            queryClient.invalidateQueries();
          },
        }),
      );

      const manageTeamMutation = useMutation(
        trpc.user.update.mutationOptions({
          onSuccess: () => {
            queryClient.invalidateQueries();
          },
        }),
      );

      const leaveTeamMutation = useMutation(
        trpc.team.leave.mutationOptions({
          onError: () => {
            toast({
              duration: 6000,
              variant: "error",
              title:
                "You cannot leave since you are the only remaining owner of the team. Delete this team instead.",
            });
          },
        }),
      );

      return (
        <div className="flex justify-end">
          <div className="flex space-x-3 items-center">
            <SubmitButton
              variant="outline"
              isSubmitting={viewTeamMutation.isPending}
              onClick={() =>
                viewTeamMutation.mutate(
                  {
                    teamId: row.original.team?.id!,
                  },
                  {
                    onSuccess: () => {
                      router.push("/");
                    },
                  },
                )
              }
            >
              View
            </SubmitButton>
            {row.original.role === "owner" && (
              <SubmitButton
                variant="outline"
                isSubmitting={manageTeamMutation.isPending}
                onClick={() =>
                  manageTeamMutation.mutate(
                    {
                      teamId: row.original.team?.id!,
                    },
                    {
                      onSuccess: () => {
                        router.push("/settings");
                      },
                    },
                  )
                }
              >
                Manage
              </SubmitButton>
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
                        disabled={leaveTeamMutation.isPending}
                        onClick={() =>
                          leaveTeamMutation.mutate({
                            teamId: row.original.team?.id!,
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
