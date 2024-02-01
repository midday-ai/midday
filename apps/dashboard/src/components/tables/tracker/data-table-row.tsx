import { ProjectMembers } from "@/components/project-members";
import { TrackerStatus } from "@/components/tracker-status";
import { TableCell, TableRow } from "@midday/ui/table";

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
  return (
    <Row key={row.id} onClick={() => setOpen(row.id)}>
      <DataTableCell>{row.name}</DataTableCell>
      <DataTableCell>
        {/* TODO: Transform to readable time from minutes */}
        {row.estimate ? `${row.time ?? 0}/${row.estimate}` : row.time} h
      </DataTableCell>
      <DataTableCell>{row.description}</DataTableCell>
      <DataTableCell>
        <ProjectMembers members={row.members} />
      </DataTableCell>
      <DataTableCell>
        <TrackerStatus status={row.status} />
      </DataTableCell>
    </Row>
  );
}
