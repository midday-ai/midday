"use client";

import { createProjectReport } from "@/actions/project/create-project-report";
import { deleteProjectAction } from "@/actions/project/delete-project-action";
import { CopyInput } from "@/components/copy-input";
import { TrackerStatus } from "@/components/tracker-status";
import { secondsToHoursAndMinutes } from "@/utils/format";
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
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";

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
  const { toast, dismiss } = useToast();

  const createReport = useAction(createProjectReport, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
    onSuccess: (data) => {
      const { id } = toast({
        title: "Time Report Published",
        description: "Your report is ready to share.",
        variant: "success",
        footer: (
          <div className="mt-4 space-x-2 flex w-full">
            <CopyInput
              value={data.short_link}
              className="border-[#2C2C2C] w-full"
            />

            <Link href={data.short_link} onClick={() => dismiss(id)}>
              <Button>View</Button>
            </Link>
          </div>
        ),
      });
    },
  });

  const deleteAction = useAction(deleteProjectAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  return (
    <AlertDialog>
      <DropdownMenu>
        <Row onClick={() => setParams({ projectId: row.id })}>
          <DataTableCell>{row.name}</DataTableCell>
          <DataTableCell>
            <span className="text-sm">
              {secondsToHoursAndMinutes(row?.total_duration)}
            </span>
          </DataTableCell>
          <DataTableCell>{row.description}</DataTableCell>

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
          <DropdownMenuItem
            onClick={() =>
              createReport.execute({
                projectId: row.id,
                baseUrl: window.location.origin,
              })
            }
          >
            Share Report
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
