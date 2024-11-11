import { changeUserRoleAction } from "@/actions/change-user-role-action";
import { deleteTeamMemberAction } from "@/actions/delete-team-member-action";
import { leaveTeamAction } from "@/actions/leave-team-action";
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
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";

export const columns: ColumnDef[] = [
  {
    id: "member",
    accessorKey: "user.full_name",
    cell: ({ row }) => {
      return (
        <div>
          <div className="flex items-center space-x-4">
            <Avatar className="rounded-full w-8 h-8">
              <AvatarImageNext
                src={row.original.user?.avatar_url}
                alt={row.original.user?.full_name ?? ""}
                width={32}
                height={32}
              />
              <AvatarFallback>
                <span className="text-xs">
                  {row.original.user.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {row.original.user.full_name}
              </span>
              <span className="text-sm text-[#606060]">
                {row.original.user.email}
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
      const router = useRouter();
      const { toast } = useToast();

      const changeUserRole = useAction(changeUserRoleAction, {
        onSuccess: () => {
          toast({
            title: "Team role has been updated.",
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

      const deleteTeamMember = useAction(deleteTeamMemberAction, {
        onSuccess: () => {
          toast({
            title: "Team member removed.",
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

      const leaveTeam = useAction(leaveTeamAction, {
        onSuccess: () => router.push("/teams"),
        onError: () => {
          toast({
            duration: 3500,
            variant: "error",
            title:
              "You cannot leave since you are the only remaining owner of the team. Delete this team instead.",
          });
        },
      });

      return (
        <div className="flex justify-end">
          <div className="flex space-x-2 items-center">
            {(table.options.meta.currentUser.role === "owner" &&
              table.options.meta.currentUser.user.id !==
                row.original.user.id) ||
            (table.options.meta.currentUser.role === "owner" &&
              table.options.meta.totalOwners > 1) ? (
              <Select
                value={row.original.role}
                onValueChange={(role) => {
                  changeUserRole.execute({
                    userId: row.original.user.id,
                    teamId: row.original.team_id,
                    role,
                    revalidatePath: "/settings/members",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t(`roles.${row.original.role}`)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-[#606060]">
                {t(`roles.${row.original.role}`)}
              </span>
            )}

            {table.options.meta.currentUser.role === "owner" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table.options.meta.currentUser.user.id !==
                    row.original.user.id && (
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
                            disabled={deleteTeamMember.status === "executing"}
                            onClick={() =>
                              deleteTeamMember.execute({
                                userId: row.original.user.id,
                                teamId: row.original.team_id,
                                revalidatePath: "/settings/members",
                              })
                            }
                          >
                            {deleteTeamMember.status === "executing" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {table.options.meta.currentUser.user.id ===
                    row.original.user.id && (
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
                            disabled={leaveTeam.status === "executing"}
                            onClick={() =>
                              leaveTeam.execute({
                                teamId: row.original.team_id,
                                role: row.original.role,
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
