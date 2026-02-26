"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";

type BankAnalysisRow = {
  month: string;
  deposits: number;
  payBurden: number;
  holdbackPct: number;
};

type Props = {
  data: BankAnalysisRow[];
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const formatPercent = (n: number) =>
  `${(n * 100).toFixed(1)}%`;

export function BankAnalysisTable({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Bank Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-[12px] font-medium text-[#606060]">
                  Month
                </TableHead>
                <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                  Deposits
                </TableHead>
                <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                  Pay Burden
                </TableHead>
                <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                  Holdback %
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="text-sm">{row.month}</TableCell>
                  <TableCell className="text-sm font-mono text-right">
                    {formatCurrency(row.deposits)}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-right">
                    {formatCurrency(row.payBurden)}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-right">
                    {formatPercent(row.holdbackPct)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
