"use client";

import { BaseCanvas, CanvasHeader } from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import { useUserQuery } from "@/hooks/use-user";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { metricsBreakdownInvoicesArtifact } from "@api/ai/artifacts/metrics-breakdown";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";

export function MetricsBreakdownInvoicesCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(metricsBreakdownInvoicesArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const stage = data?.stage;
  const invoices = data?.invoices || [];
  const showData = stage && ["metrics_ready", "analysis_ready"].includes(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Invoices" />

      <CanvasContent>
        <div className="space-y-8">
          {showData && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[18px] font-normal font-serif text-black dark:text-white">
                  Invoices
                </h4>
                <Link
                  href="/invoices"
                  className="text-[12px] text-[#707070] dark:text-[#666666] hover:underline"
                >
                  View all
                </Link>
              </div>
              {invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0">
                      <TableHead className="text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Invoice #
                      </TableHead>
                      <TableHead className="text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Customer
                      </TableHead>
                      <TableHead className="text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Status
                      </TableHead>
                      <TableHead className="text-right text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(0, 50).map((inv, index) => (
                      <TableRow
                        key={inv.id}
                        className={cn(
                          index === invoices.slice(0, 50).length - 1 &&
                            "border-b-0",
                        )}
                      >
                        <TableCell className="text-[12px] text-black dark:text-white">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-[12px] text-black dark:text-white">
                          {inv.customerName}
                        </TableCell>
                        <TableCell className="text-[12px] text-[#707070] dark:text-[#666666]">
                          {inv.status}
                        </TableCell>
                        <TableCell className="text-right text-[12px] text-black dark:text-white font-medium">
                          {inv.formattedAmount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-[12px] text-[#707070] dark:text-[#666666]">
                  No invoices found
                </p>
              )}
            </div>
          )}
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
