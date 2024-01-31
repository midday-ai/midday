"use client";

import { TrackerCreateSheet } from "@/components/sheets/tracker-create-sheet";
import { TrackerSheet } from "@/components/sheets/tracker-sheet";
import { createClient } from "@midday/supabase/client";
import { Table, TableBody } from "@midday/ui/table";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect } from "react";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";

type Item = {
  id: string;
};

type ItemsProps = {
  data: Item[];
  teamId?: string;
  initialDate: string;
};

export function DataTable({ data, teamId, records }: ItemsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [params, setParams] = useQueryStates(
    {
      date: parseAsString,
      id: parseAsString,
    },
    {
      shallow: true,
    }
  );

  const setOpen = (id: string | boolean) => {
    if (id) {
      setParams({ id });
    } else {
      setParams({
        id: null,
        date: null,
      });
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("realtime_tracker")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracker",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, teamId]);

  return (
    <>
      <Table>
        <DataTableHeader />

        <TableBody>
          {data.map((row) => (
            <DataTableRow row={row} key={row.id} setOpen={setOpen} />
          ))}
        </TableBody>
      </Table>

      <TrackerSheet
        isOpen={Boolean(params.id)}
        setOpen={setOpen}
        date={params.date}
        records={records}
      />

      <TrackerCreateSheet />
    </>
  );
}
