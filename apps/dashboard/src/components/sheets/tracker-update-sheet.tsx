"use client";

import { TrackerProjectForm } from "@/components/forms/tracker-project-form";
import { useLatestProjectId } from "@/hooks/use-latest-project-id";
import { useTrackerParams } from "@/hooks/use-tracker-params";
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
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
type Props = {
  defaultCurrency: string;
};

export function TrackerUpdateSheet({ defaultCurrency }: Props) {
  const { setParams, update, projectId } = useTrackerParams();
  const { latestProjectId, setLatestProjectId } = useLatestProjectId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const isOpen = update !== null && Boolean(projectId);

  const { data } = useQuery(
    trpc.trackerProjects.getById.queryOptions(
      { id: projectId! },
      {
        enabled: isOpen,
        staleTime: 60 * 1000,
        initialData: () => {
          const pages = queryClient
            .getQueriesData({
              queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
            })
            .flatMap(([, data]) => data?.pages ?? [])
            .flatMap((page) => page.data ?? []);

          return pages.find((d) => d.id === projectId);
        },
      },
    ),
  );

  const deleteTrackerProjectMutation = useMutation(
    trpc.trackerProjects.delete.mutationOptions({
      onSuccess: (result) => {
        if (result && result.id === latestProjectId) {
          setLatestProjectId(null);
        }

        setParams(null);

        queryClient.invalidateQueries({
          queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
        });
      },
    }),
  );

  return (
    <AlertDialog>
      <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
        <SheetContent>
          <SheetHeader className="mb-8 flex justify-between items-center flex-row">
            <h2 className="text-xl">Edit Project</h2>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Icons.MoreVertical className="w-5 h-5" />
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-42" sideOffset={10} align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          </SheetHeader>

          <ScrollArea className="h-full p-0 pb-28" hideScrollbar>
            <TrackerProjectForm
              data={data}
              key={data?.id}
              defaultCurrency={defaultCurrency}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
            onClick={() =>
              deleteTrackerProjectMutation.mutate({ id: projectId! })
            }
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
