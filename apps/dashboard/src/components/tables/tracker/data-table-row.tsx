"use client";

import { deleteProjectAction } from "@/actions/project/delete-project-action";
import { ProjectMembers } from "@/components/project-members";
import { TrackerStatus } from "@/components/tracker-status";
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
import { TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { intervalToDuration } from "date-fns";
import { useAction } from "next-safe-action/hooks";

export function DataTableCell({ children, className }) {
  return <TableCell className={className}>{children}</TableCell>;
}

export function Row({ onClick, children }) {
  return (
    <TableRow className="h-[45px]" onClick={onClick}>
      {children}
    </TableRow>
  );
}

export function DataTableRow({ row, setParams }) {
  const { toast } = useToast();

  const deleteAction = useAction(deleteProjectAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const handleShareURL = async (id: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/tracker?projectId=${id}`
      );

      toast({
        duration: 4000,
        title: "Copied URL to clipboard.",
        variant: "success",
      });
    } catch {}
  };

  const duration = intervalToDuration({
    start: 0,
    end: row.total_duration * 1000,
  });

  return (
    <AlertDialog>
      <DropdownMenu>
        <Row onClick={() => setParams({ projectId: row.id })}>
          <DataTableCell>{row.name}</DataTableCell>
          <DataTableCell>
            <span className="text-sm">
              {duration.hours ?? "00"}:{duration.minutes ?? "00"}:
              {duration.seconds ?? "00"}
            </span>
          </DataTableCell>
          <DataTableCell>{row.description}</DataTableCell>
          <DataTableCell>
            {/* <ProjectMembers members={row.members} /> */}
          </DataTableCell>
          <DataTableCell className="flex justify-between items-center">
            <TrackerStatus status={row.status} />

            <DropdownMenuTrigger>
              <Icons.MoreHoriz />
            </DropdownMenuTrigger>
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
          <DropdownMenuItem onClick={() => handleShareURL(row.id)}>
            Share URL
          </DropdownMenuItem>

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
