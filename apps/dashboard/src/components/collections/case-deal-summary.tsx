"use client";

import { FormatAmount } from "@/components/format-amount";
import { cn } from "@midday/ui/cn";
import type { RouterOutputs } from "@api/trpc/routers/_app";

type CaseData = NonNullable<RouterOutputs["collections"]["getById"]>;

type Props = {
  data: CaseData;
};

const dealStatusStyles: Record<string, string> = {
  active: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  late: "text-[#f97316] bg-[#f97316]/10",
  defaulted: "text-[#FF3638] bg-[#FF3638]/10",
  in_collections: "text-[#8b5cf6] bg-[#8b5cf6]/10",
  paid_off: "text-[#00C969] bg-[#DDF1E4]",
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-[#606060]">{label}</span>
      <span className="text-sm font-medium font-mono">{children}</span>
    </div>
  );
}

export function CaseDealSummary({ data }: Props) {
  return (
    <div className="border border-border bg-background p-4">
      <h3 className="text-sm font-medium mb-3">Deal Summary</h3>
      <div className="divide-y divide-border">
        <Row label="Deal Code">
          <span className="text-sm">{data.dealCode || "-"}</span>
        </Row>
        <Row label="Funded Amount">
          {data.fundingAmount ? (
            <FormatAmount amount={Number(data.fundingAmount)} currency="USD" />
          ) : (
            "-"
          )}
        </Row>
        <Row label="Payback Amount">
          {data.paybackAmount ? (
            <FormatAmount amount={Number(data.paybackAmount)} currency="USD" />
          ) : (
            "-"
          )}
        </Row>
        <Row label="Current Balance">
          {data.currentBalance ? (
            <FormatAmount amount={Number(data.currentBalance)} currency="USD" />
          ) : (
            "-"
          )}
        </Row>
        <Row label="Total Paid">
          {data.totalPaid ? (
            <FormatAmount amount={Number(data.totalPaid)} currency="USD" />
          ) : (
            "-"
          )}
        </Row>
        <Row label="Factor Rate">
          {data.factorRate ? Number(data.factorRate).toFixed(2) : "-"}
        </Row>
        <Row label="Funded Date">
          <span className="text-sm font-normal">
            {data.fundedAt
              ? new Date(data.fundedAt).toLocaleDateString()
              : "-"}
          </span>
        </Row>
        <Row label="Deal Status">
          {data.dealStatus ? (
            <div
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-medium",
                dealStatusStyles[data.dealStatus] ||
                  "text-[#6b7280] bg-[#6b7280]/10",
              )}
            >
              {data.dealStatus.replace("_", " ")}
            </div>
          ) : (
            "-"
          )}
        </Row>
      </div>
    </div>
  );
}
