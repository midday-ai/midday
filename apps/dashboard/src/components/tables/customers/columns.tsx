"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Spinner } from "@midday/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";
import { memo, useCallback } from "react";
import { FormatAmount } from "@/components/format-amount";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { getWebsiteLogo } from "@/utils/logos";

export type Customer = RouterOutputs["customers"]["get"]["data"][number];

const NameCell = memo(
  ({ name, website }: { name: string | null; website: string | null }) => {
    if (!name) return "-";

    // Logo from logo.dev based on website domain
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
        <span className="truncate">{name}</span>
      </div>
    );
  },
);

NameCell.displayName = "NameCell";

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
    customerId,
    hasWebsite,
    enrichmentStatus,
    onDelete,
    onEnrich,
  }: {
    customerId: string;
    hasWebsite: boolean;
    enrichmentStatus: string | null;
    onDelete?: (id: string) => void;
    onEnrich?: (id: string) => void;
  }) => {
    const { setParams } = useCustomerParams();

    const handleEdit = useCallback(() => {
      setParams({ customerId });
    }, [customerId, setParams]);

    const handleDelete = useCallback(() => {
      onDelete?.(customerId);
    }, [customerId, onDelete]);

    const handleEnrich = useCallback(() => {
      onEnrich?.(customerId);
    }, [customerId, onEnrich]);

    const isEnriching =
      enrichmentStatus === "pending" || enrichmentStatus === "processing";

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
              Edit customer
            </DropdownMenuItem>

            {hasWebsite && !isEnriching && (
              <DropdownMenuItem onClick={handleEnrich}>
                Enrich company
              </DropdownMenuItem>
            )}

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

/**
 * Reusable enriching cell - shows spinner + "Enriching" with tooltip
 * Used consistently across all enrichment-powered columns
 */
const EnrichingCell = memo(() => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center space-x-2 cursor-help">
          <Spinner size={14} className="stroke-primary" />
          <span className="text-[#878787] text-sm">Enriching</span>
        </div>
      </TooltipTrigger>
      <TooltipContent
        className="px-3 py-1.5 text-xs max-w-[280px]"
        side="top"
        sideOffset={5}
      >
        Analyzing company details to enrich customer data.
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

EnrichingCell.displayName = "EnrichingCell";

// Website link cell
const WebsiteCell = memo(({ website }: { website: string | null }) => {
  if (!website) return "-";

  // Clean up URL for display
  const displayUrl = website.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <a
      href={website.startsWith("http") ? website : `https://${website}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline truncate block"
      onClick={(e) => e.stopPropagation()}
    >
      {displayUrl}
    </a>
  );
});

WebsiteCell.displayName = "WebsiteCell";

export const columns: ColumnDef<Customer>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    size: 320,
    minSize: 240,
    maxSize: 500,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "avatar-text", width: "w-32" },
      headerLabel: "Name",
      className:
        "w-[320px] min-w-[240px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => (
      <NameCell name={row.original.name} website={row.original.website} />
    ),
  },
  {
    id: "contact",
    accessorKey: "contact",
    header: "Contact person",
    size: 260,
    minSize: 180,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Contact",
      className: "w-[260px] min-w-[180px]",
    },
    cell: ({ row }) => row.getValue("contact") ?? "-",
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    size: 300,
    minSize: 220,
    maxSize: 450,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Email",
      className: "w-[300px] min-w-[220px]",
    },
    cell: ({ row }) => row.getValue("email") ?? "-",
  },
  {
    id: "invoices",
    accessorKey: "invoices",
    header: "Invoices",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Invoices",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row }) => {
      if (row.original.invoiceCount > 0) {
        return (
          <Link href={`/invoices?customers=${row.original.id}`}>
            {row.original.invoiceCount}
          </Link>
        );
      }

      return "-";
    },
  },
  {
    id: "projects",
    accessorKey: "projects",
    header: "Projects",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Projects",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row }) => {
      if (row.original.projectCount > 0) {
        return (
          <Link href={`/tracker?customers=${row.original.id}`}>
            {row.original.projectCount}
          </Link>
        );
      }

      return "-";
    },
  },
  {
    id: "industry",
    accessorKey: "industry",
    header: "Industry",
    size: 150,
    minSize: 120,
    maxSize: 250,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Industry",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      if (
        row.original.enrichmentStatus === "processing" ||
        row.original.enrichmentStatus === "pending"
      ) {
        return <EnrichingCell />;
      }
      if (!row.original.industry) return "-";
      return (
        <Badge variant="tag" className="whitespace-nowrap">
          {row.original.industry}
        </Badge>
      );
    },
  },
  {
    id: "country",
    accessorKey: "country",
    header: "Country",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-16" },
      headerLabel: "Country",
      sortField: "country",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => {
      const country = row.original.country;
      if (!country) return "-";
      return country;
    },
  },
  {
    id: "financeEmail",
    accessorKey: "financeContactEmail",
    header: "Finance Email",
    size: 220,
    minSize: 180,
    maxSize: 320,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Finance Email",
      className: "w-[220px] min-w-[180px]",
    },
    cell: ({ row }) => {
      if (
        row.original.enrichmentStatus === "processing" ||
        row.original.enrichmentStatus === "pending"
      ) {
        return <EnrichingCell />;
      }
      const email = row.original.financeContactEmail;
      if (!email) return "-";
      return (
        <a
          href={`mailto:${email}`}
          className="text-primary hover:underline truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {email}
        </a>
      );
    },
  },
  {
    id: "language",
    accessorKey: "primaryLanguage",
    header: "Language",
    size: 120,
    minSize: 100,
    maxSize: 150,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-10" },
      headerLabel: "Language",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row }) => {
      if (
        row.original.enrichmentStatus === "processing" ||
        row.original.enrichmentStatus === "pending"
      ) {
        return <EnrichingCell />;
      }
      const lang = row.original.primaryLanguage;
      if (!lang) return "-";
      return <span>{lang}</span>;
    },
  },
  {
    id: "totalRevenue",
    accessorKey: "totalRevenue",
    header: "Revenue",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-16" },
      headerLabel: "Revenue",
      sortField: "total_revenue",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => {
      const amount = Number(row.original.totalRevenue);
      const currency = row.original.invoiceCurrency;
      if (!amount || amount <= 0) return "-";
      return <FormatAmount amount={amount} currency={currency || "USD"} />;
    },
  },
  {
    id: "outstanding",
    accessorKey: "outstandingAmount",
    header: "Outstanding",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Outstanding",
      sortField: "outstanding",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const amount = Number(row.original.outstandingAmount);
      const currency = row.original.invoiceCurrency;
      if (!amount || amount <= 0) return "-";
      return <FormatAmount amount={amount} currency={currency || "USD"} />;
    },
  },
  {
    id: "lastInvoice",
    accessorKey: "lastInvoiceDate",
    header: "Last Invoice",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Last Invoice",
      sortField: "last_invoice",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => {
      const date = row.original.lastInvoiceDate;
      if (!date) return "-";
      return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
    },
  },
  {
    id: "website",
    accessorKey: "website",
    header: "Website",
    size: 180,
    minSize: 140,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-28" },
      headerLabel: "Website",
      className: "w-[180px] min-w-[140px]",
    },
    cell: ({ row }) => <WebsiteCell website={row.original.website} />,
  },
  {
    id: "tags",
    accessorKey: "tags",
    header: "Tags",
    size: 320,
    minSize: 180,
    maxSize: 500,
    enableResizing: true,
    meta: {
      skeleton: { type: "tags" },
      headerLabel: "Tags",
      className: "w-[320px] min-w-[180px]",
    },
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
  {
    id: "actions",
    header: "Actions",
    size: 100,
    minSize: 100,
    maxSize: 100,
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
        customerId={row.original.id}
        hasWebsite={Boolean(row.original.website)}
        enrichmentStatus={row.original.enrichmentStatus}
        onDelete={table.options.meta?.deleteCustomer}
        onEnrich={table.options.meta?.enrichCustomer}
      />
    ),
  },
];
