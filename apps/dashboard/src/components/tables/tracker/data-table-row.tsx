"use client";

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
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";

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

export function DataTableRow({ row, setOpen }) {
  const { toast } = useToast();

  const handleSearch = async (id: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/tracker?id=${id}`
      );

      toast({
        duration: 4000,
        title: "Copied URL to clipboard.",
        variant: "success",
      });
    } catch {}
  };

  return (
    <AlertDialog>
      <Row>
        <DataTableCell>{row.name}</DataTableCell>
        <DataTableCell>
          {/* TODO: Transform to readable time from minutes */}
          {row.estimate ? `${row.time ?? 0}/${row.estimate}` : row.time} h
        </DataTableCell>
        <DataTableCell>{row.description}</DataTableCell>
        <DataTableCell>
          <ProjectMembers members={row.members} />
        </DataTableCell>
        <DataTableCell className="flex justify-between items-center">
          <TrackerStatus status={row.status} />

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Icons.MoreHoriz />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-42" sideOffset={10} align="end">
              <DropdownMenuItem>Mark as complete</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSearch(row.id)}>
                Share URL
              </DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
