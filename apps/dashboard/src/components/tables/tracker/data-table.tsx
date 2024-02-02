"use client";

import { TrackerCreateSheet } from "@/components/sheets/tracker-create-sheet";
import { TrackerSheet } from "@/components/sheets/tracker-sheet";
import { Table, TableBody } from "@midday/ui/table";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";

type Item = {
  id: string;
};

type ItemsProps = {
  data: Item[];
  teamId?: string;
  initialDate: string;
  currencyCode?: string;
};

export function DataTable({ records, currencyCode }: ItemsProps) {
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

  return (
    <>
      <Table>
        <DataTableHeader />

        <TableBody>
          {records.map((row) => (
            <DataTableRow row={row} key={row.id} setOpen={setOpen} />
          ))}
        </TableBody>
      </Table>

      <TrackerSheet
        isOpen={Boolean(params.id)}
        setOpen={setOpen}
        records={records}
      />

      <TrackerCreateSheet currencyCode={currencyCode} />
      {/* <TrackerUpdateSheet currencyCode={currencyCode} /> */}
    </>
  );
}
