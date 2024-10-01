"use client";

import { deleteProjectAction } from "@/actions/project/delete-project-action";
import { updateProjectAction } from "@/actions/project/update-project-action";
import { TrackerExportCSV } from "@/components/tracker-export-csv";
import { TrackerStatus } from "@/components/tracker-status";
import { useTrackerParams } from "@/hooks/use-tracker-params";
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
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
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
import type { TrackerProject } from "./data-table";

type DataTableCellProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTableCell({ children, className }: DataTableCellProps) {
  return <TableCell className={className}>{children}</TableCell>;
}

type RowProps = {
  onClick: () => void;
  children: React.ReactNode;
};

export function Row({ onClick, children }: RowProps) {
  return (
    <TableRow className="h-[45px]" onClick={onClick}>
      {children}
    </TableRow>
  );
}

type DataTableRowProps = {
  row: TrackerProject;
  userId: string;
};

export function DataTableRow({ row, userId }: DataTableRowProps) {
  const { toast } = useToast();
  const { setParams } = useTrackerParams();

  const deleteAction = useAction(deleteProjectAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const updateAction = useAction(updateProjectAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
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
              {row.estimate
                ? `${secondsToHoursAndMinutes(row.total_duration)} / ${secondsToHoursAndMinutes(row.estimate * 3600)}`
                : secondsToHoursAndMinutes(row?.total_duration)}
            </span>
          </DataTableCell>
          <DataTableCell>
            <span className="text-sm">
              {formatAmount({
                currency: row.currency,
                amount: row.total_amount,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </DataTableCell>
          <DataTableCell>{row.description}</DataTableCell>
          <DataTableCell>
            <div className="flex items-center space-x-2">
              {row.users?.map((user) => (
                <Avatar key={user.id} className="size-4">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-[10px]">
                    {user.full_name?.slice(0, 1)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </DataTableCell>
          <DataTableCell>
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

          <TrackerExportCSV
            name={row.name}
            projectId={row.id}
            currency={row.currency}
            billable={row.billable}
            rate={row.rate}
            teamId={row.team_id}
            userId={userId}
          />

          {row.status !== "completed" && (
            <DropdownMenuItem
              onClick={() =>
                updateAction.execute({
                  id: row.id,
                  status: "completed",
                })
              }
            >
              Mark as complete
            </DropdownMenuItem>
          )}

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
