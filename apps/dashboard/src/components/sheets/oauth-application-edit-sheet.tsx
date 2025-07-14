"use client";

import { OAuthApplicationForm } from "@/components/forms/oauth-application-form";
import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function OAuthApplicationEditSheet() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams, applicationId, editApplication } =
    useOAuthApplicationParams();

  const isOpen = Boolean(applicationId && editApplication);

  const { data: application } = useQuery(
    trpc.oauthApplications.get.queryOptions(
      { id: applicationId! },
      {
        enabled: isOpen,
      },
    ),
  );

  const deleteApplicationMutation = useMutation(
    trpc.oauthApplications.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.list.queryKey(),
        });
        setParams(null);
      },
    }),
  );

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Edit OAuth Application</h2>

          {applicationId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button">
                  <Icons.MoreVertical className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={10} align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the OAuth application and revoke all active
                        tokens. Applications using this will stop working
                        immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteApplicationMutation.mutate({
                            id: applicationId,
                          })
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SheetHeader>

        <ScrollArea className="h-full p-0 pb-10" hideScrollbar>
          <OAuthApplicationForm data={application} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
