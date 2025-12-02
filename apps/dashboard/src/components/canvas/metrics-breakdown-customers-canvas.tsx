"use client";

import { BaseCanvas, CanvasHeader } from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import { formatCurrencyAmount } from "@/components/canvas/utils";
import { useUserQuery } from "@/hooks/use-user";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { metricsBreakdownCustomersArtifact } from "@api/ai/artifacts/metrics-breakdown";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { parseAsInteger, useQueryState } from "nuqs";

export function MetricsBreakdownCustomersCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(metricsBreakdownCustomersArtifact, {
    version,
  });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;
  const topCustomers = data?.topCustomers || [];
  const showData = stage && ["metrics_ready", "analysis_ready"].includes(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Top Customers" />

      <CanvasContent>
        <div className="space-y-8">
          {showData && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[18px] font-normal font-serif text-black dark:text-white">
                  Top Customers
                </h4>
              </div>
              {topCustomers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0">
                      <TableHead className="text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Customer
                      </TableHead>
                      <TableHead className="text-right text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Revenue
                      </TableHead>
                      <TableHead className="text-right text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Invoices
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((customer, index) => (
                      <TableRow
                        key={customer.name}
                        className={cn(
                          index === topCustomers.length - 1 && "border-b-0",
                        )}
                      >
                        <TableCell className="text-[12px] text-black dark:text-white">
                          {customer.name}
                        </TableCell>
                        <TableCell className="text-right text-[12px] text-black dark:text-white font-medium">
                          {formatCurrencyAmount(
                            customer.revenue,
                            currency,
                            locale,
                          )}
                        </TableCell>
                        <TableCell className="text-right text-[12px] text-[#707070] dark:text-[#666666]">
                          {customer.invoiceCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-[12px] text-[#707070] dark:text-[#666666]">
                  No customers found
                </p>
              )}
            </div>
          )}
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
