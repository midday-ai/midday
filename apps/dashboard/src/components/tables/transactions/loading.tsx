import { columns } from "./columns";
import { DataTable } from "./table";

const data = [...Array(25)].map((_, i) => ({ id: i.toString() }));

export function Loading() {
  return <DataTable columns={columns} data={data} loading />;
}
