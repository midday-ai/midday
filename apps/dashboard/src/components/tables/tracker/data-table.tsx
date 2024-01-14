"use client";

import { TrackerSheet } from "@/components/sheets/tracker-sheet";
import { createClient } from "@midday/supabase/client";
import { Table, TableBody } from "@midday/ui/table";
import { parseAsString, useQueryStates } from "next-usequerystate";
import { useRouter } from "next/navigation";
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

export function DataTable({ data, teamId, initialDate }: ItemsProps) {
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

  const selectedItem = data?.find((d) => d.id === params.id);

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
    const currentIndex = data?.findIndex((row) => row.id === params.id);

    const keyDownHandler = (evt: KeyboardEvent) => {
      if (params && evt.key === "ArrowDown") {
        evt.preventDefault();
        const nextItem = data.at(currentIndex + 1);

        if (nextItem) {
          setParams({ id: nextItem.id });
        }
      }

      if (params && evt.key === "Escape") {
        setParams(null);
      }

      if (params && evt.key === "ArrowUp") {
        evt.preventDefault();

        const prevItem = data.at(currentIndex - 1);

        if (currentIndex > 0 && prevItem) {
          setParams({ id: prevItem.id });
        }
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [params, data, setParams]);

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
      />
    </>
  );
}
