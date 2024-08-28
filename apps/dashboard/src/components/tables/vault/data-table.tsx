"use client";

import { useVaultContext } from "@/store/vault/hook";
import { createClient } from "@midday/supabase/client";
import { Table, TableBody } from "@midday/ui/table";
import { useEffect } from "react";
import { DataTableRow } from "./data-table-row";
import { DataTableHeader } from "./date-table-header";

export function DataTable({ teamId }: { teamId: string }) {
  const { data, updateItem } = useVaultContext((s) => s);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime_documents")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.new.id) {
            updateItem(payload.new.id, {
              tag: payload.new?.tag,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Table>
      <DataTableHeader />

      <TableBody className="border-r-0 border-l-0">
        {data?.map((row) => (
          <DataTableRow key={row.name} data={row} />
        ))}
      </TableBody>
    </Table>
  );
}
