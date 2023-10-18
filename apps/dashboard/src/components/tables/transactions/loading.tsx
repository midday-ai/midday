import { DataTable } from "./data-table";

const data = [...Array(25)].map((_, i) => ({ id: i.toString() }));

export function Loading() {
  return <DataTable data={data} />;
}
