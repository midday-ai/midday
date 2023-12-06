"use client";

import { createFolderAction } from "@/actions/create-folder-action";
import { deleteFileAction } from "@/actions/delete-file-action";
import { deleteFolderAction } from "@/actions/delete-folder-action";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hook";
import { useOptimistic } from "react";
import { DataTableRow } from "./data-table-row";

export function DataTable({ data }) {
  const { toast } = useToast();

  const [optimisticData, setOptimisticData] = useOptimistic(
    data,
    (state, { action, ...item }) => {
      switch (action) {
        case "delete":
          return state.filter(({ id }) => id !== item.id);
        case "delete-folder":
          return state.filter(({ name }) => name !== item.name);
        case "update":
          return state.map((d) => (d.id === item.id ? item : d));
        default:
          return [...state, item];
      }
    }
  );

  const deleteFile = useAction(deleteFileAction, {
    onExecute: ({ id }) => {
      setOptimisticData({ action: "delete", id });
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const deleteFolder = useAction(deleteFolderAction, {
    onExecute: ({ id }) => {
      setOptimisticData({ action: "delete-folder", id });
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const createFolder = useAction(createFolderAction, {
    onExecute: () => {
      setOptimisticData({ id: "new" });
    },
    onError: () => {
      toast({
        duration: 3500,
        title:
          "The folder already exists in the current directory. Please use a different name.",
      });
    },
  });

  return (
    <Table>
      <TableHeader
        className="border-0 sticky top-0 backdrop-blur backdrop-filter bg-opacity-50"
        style={{ background: "var(--sticky)" }}
      >
        <TableRow>
          <TableHead className="w-[60%]">Name</TableHead>
          <TableHead className="w-[15%]">Created at</TableHead>
          <TableHead className="w-full">Last modified at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="border-r-0 border-l-0">
        {optimisticData?.map((row) => (
          <DataTableRow
            key={row.name}
            data={row}
            deleteFile={(params) => deleteFile.execute(params)}
            deleteFolder={(params) => deleteFolder.execute(params)}
            createFolder={(params) => createFolder.execute(params)}
          />
        ))}
      </TableBody>
    </Table>
  );
}
