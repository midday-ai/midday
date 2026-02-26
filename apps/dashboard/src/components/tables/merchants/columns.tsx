"use client";

import { FormatAmount } from "@/components/format-amount";
import { useMerchantParams } from "@/hooks/use-merchant-params";
import { getWebsiteLogo } from "@/utils/logos";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { memo, useCallback } from "react";

export type Merchant = RouterOutputs["merchants"]["get"]["data"][number];

const MerchantCell = memo(
  ({
    name,
    email,
    website,
  }: {
    name: string | null;
    email: string | null;
    website: string | null;
  }) => {
    if (!name) return "-";

    const imageSrc = website ? getWebsiteLogo(website) : null;

    return (
      <div className="flex items-center space-x-2">
        <Avatar className="size-5">
          {imageSrc && (
            <AvatarImageNext
              src={imageSrc}
              alt={`${name} logo`}
              width={20}
              height={20}
              quality={100}
            />
          )}
          <AvatarFallback className="text-[9px] font-medium">
            {name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="truncate font-medium text-sm">{name}</span>
          {email && (
            <span className="truncate text-xs text-[#878787]">{email}</span>
          )}
        </div>
      </div>
    );
  },
);

MerchantCell.displayName = "MerchantCell";

const statusStyles: Record<string, string> = {
  active: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  inactive:
    "text-[#878787] bg-[#F2F1EF] dark:text-[#878787] dark:bg-[#1D1D1D]",
  prospect: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  churned: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  prospect: "Prospect",
  churned: "Churned",
};

const StatusCell = memo(({ status }: { status: string | null }) => {
  if (!status) return "-";

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        statusStyles[status] || statusStyles.inactive,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {statusLabels[status] || status}
      </span>
    </div>
  );
});

StatusCell.displayName = "StatusCell";

const PaidPercentCell = memo(
  ({ totalPaid, totalPayback }: { totalPaid: number; totalPayback: number }) => {
    if (!totalPayback || totalPayback <= 0) return "-";

    const pct = Math.round((totalPaid / totalPayback) * 100);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs tabular-nums font-mono">{pct}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            ${totalPaid.toLocaleString()} of ${totalPayback.toLocaleString()} repaid
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

PaidPercentCell.displayName = "PaidPercentCell";

const NsfCell = memo(({ count }: { count: number }) => {
  if (!count || count <= 0) return <span className="text-[#878787]">0</span>;

  return (
    <span className="text-red-600 font-medium tabular-nums font-mono">
      {count}
    </span>
  );
});

NsfCell.displayName = "NsfCell";

const TagsCell = memo(
  ({ tags }: { tags?: { id: string; name: string | null }[] }) => (
    <div className="relative w-full">
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
        {tags?.map((tag) => (
          <Link href={`/transactions?tags=${tag.id}`} key={tag.id}>
            <Badge variant="tag" className="whitespace-nowrap flex-shrink-0">
              {tag.name}
            </Badge>
          </Link>
        ))}
      </div>
      <div className="absolute group-hover:hidden right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  ),
);

TagsCell.displayName = "TagsCell";

const ActionsCell = memo(
  ({
    merchantId,
    onDelete,
  }: {
    merchantId: string;
    onDelete?: (id: string) => void;
  }) => {
    const { setParams } = useMerchantParams();

    const handleEdit = useCallback(() => {
      setParams({ merchantId });
    }, [merchantId, setParams]);

    const handleDelete = useCallback(() => {
      onDelete?.(merchantId);
    }, [merchantId, onDelete]);

    return (
      <div className="flex items-center justify-center w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="relative">
            <Button variant="ghost" className="h-8 w-8 p-0">
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              Edit merchant
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleDelete} className="text-[#FF3638]">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);

ActionsCell.displayName = "ActionsCell";

export const columns: ColumnDef<Merchant>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Merchant",
    size: 280,
    minSize: 220,
    maxSize: 450,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "avatar-text", width: "w-32" },
      headerLabel: "Merchant",
      className:
        "w-[280px] min-w-[220px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => (
      <MerchantCell
        name={row.original.name}
        email={row.original.email}
        website={row.original.website}
      />
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    size: 120,
    minSize: 100,
    maxSize: 160,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-16" },
      headerLabel: "Status",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row }) => <StatusCell status={row.original.status} />,
  },
  {
    id: "deals",
    accessorKey: "dealCount",
    header: "Deals",
    size: 90,
    minSize: 70,
    maxSize: 120,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Deals",
      sortField: "deals",
      className: "w-[90px] min-w-[70px]",
    },
    cell: ({ row }) => {
      const count = row.original.dealCount;
      if (!count || count <= 0) return "-";

      return (
        <span className="tabular-nums font-mono">{count}</span>
      );
    },
  },
  {
    id: "totalFunded",
    accessorKey: "totalFundedAmount",
    header: "Total Funded",
    size: 140,
    minSize: 110,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Total Funded",
      sortField: "total_funded",
      className: "w-[140px] min-w-[110px]",
    },
    cell: ({ row }) => {
      const amount = Number(row.original.totalFundedAmount);
      if (!amount || amount <= 0) return "-";
      return <FormatAmount amount={amount} currency="USD" />;
    },
  },
  {
    id: "payback",
    accessorKey: "totalPaybackAmount",
    header: "Payback",
    size: 140,
    minSize: 110,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Payback",
      sortField: "total_payback",
      className: "w-[140px] min-w-[110px]",
    },
    cell: ({ row }) => {
      const amount = Number(row.original.totalPaybackAmount);
      if (!amount || amount <= 0) return "-";
      return <FormatAmount amount={amount} currency="USD" />;
    },
  },
  {
    id: "balance",
    accessorKey: "totalDealBalance",
    header: "Balance",
    size: 140,
    minSize: 110,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Balance",
      sortField: "balance",
      className: "w-[140px] min-w-[110px]",
    },
    cell: ({ row }) => {
      const amount = Number(row.original.totalDealBalance);
      if (!amount || amount <= 0) return "-";
      return <FormatAmount amount={amount} currency="USD" />;
    },
  },
  {
    id: "paid",
    accessorKey: "totalDealPaid",
    header: "Paid",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Paid",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <PaidPercentCell
        totalPaid={Number(row.original.totalDealPaid)}
        totalPayback={Number(row.original.totalPaybackAmount)}
      />
    ),
  },
  {
    id: "totalNsf",
    accessorKey: "totalNsfCount",
    header: "Total NSF",
    size: 100,
    minSize: 80,
    maxSize: 140,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Total NSF",
      sortField: "total_nsf",
      className: "w-[100px] min-w-[80px]",
    },
    cell: ({ row }) => <NsfCell count={Number(row.original.totalNsfCount)} />,
  },
  {
    id: "contact",
    accessorKey: "contact",
    header: "Contact",
    size: 200,
    minSize: 150,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Contact",
      className: "w-[200px] min-w-[150px]",
    },
    cell: ({ row }) => row.getValue("contact") ?? "-",
  },
  {
    id: "tags",
    accessorKey: "tags",
    header: "Tags",
    size: 280,
    minSize: 180,
    maxSize: 500,
    enableResizing: true,
    meta: {
      skeleton: { type: "tags" },
      headerLabel: "Tags",
      className: "w-[280px] min-w-[180px]",
    },
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
  {
    id: "actions",
    header: "Actions",
    size: 80,
    minSize: 80,
    maxSize: 80,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "Actions",
      className:
        "text-right sticky right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 justify-center !border-l !border-border",
    },
    cell: ({ row, table }) => (
      <ActionsCell
        merchantId={row.original.id}
        onDelete={table.options.meta?.deleteMerchant}
      />
    ),
  },
];
