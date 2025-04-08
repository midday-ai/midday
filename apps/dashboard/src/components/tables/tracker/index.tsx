"use client";

import { LoadMore } from "@/components/load-more";
import { Table, TableBody } from "@midday/ui/table";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";

export function DataTable() {
  const { ref, inView } = useInView();

  // useEffect(() => {
  //   if (inView) {
  //     loadMoreData();
  //   }
  // }, [inView]);

  return (
    <>
      <Table>
        <DataTableHeader />

        <TableBody>
          {/* {data.map((row) => (
            <DataTableRow row={row} key={row.id} userId={userId} />
          ))} */}
        </TableBody>
      </Table>

      {/* <LoadMore ref={ref} hasNextPage={hasNextPage} /> */}
    </>
  );
}
