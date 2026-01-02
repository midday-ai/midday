"use client";

import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { getDueDateStatus } from "@/utils/format";
import { getWebsiteLogo } from "@/utils/logos";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { TooltipProvider } from "@midday/ui/tooltip";
import { formatDate } from "@midday/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import type { MouseEvent } from "react";
import { ActionsMenu } from "./actions-menu";

export type Invoice = NonNullable<
  RouterOutputs["invoice"]["get"]["data"]
>[number];

export const columns: ColumnDef<Invoice>[] = [
  {
    id: "select",
    size: 50,
    minSize: 50,
    maxSize: 50,
    enableResizing: false,
    enableHiding: false,
    enableSorting: false,
    meta: {
      sticky: true,
      skeleton: { type: "checkbox" },
      className:
        "w-[50px] min-w-[50px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => {
          if (checked === "indeterminate") {
            row.toggleSelected();
          } else {
            row.toggleSelected(checked);
          }
        }}
      />
    ),
  },
  {
    id: "invoiceNumber",
    header: "Invoice no.",
    accessorKey: "invoiceNumber",
    size: 180,
    minSize: 140,
    maxSize: 300,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Invoice no.",
      sortField: "invoice_number",
      className:
        "w-[180px] min-w-[140px] md:sticky md:left-[50px] bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => (
      <span
        className={cn("truncate", {
          "line-through":
            row.original.status === "canceled" ||
            row.original.status === "refunded",
        })}
      >
        {row.getValue("invoiceNumber")}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "badge", width: "w-16" },
      headerLabel: "Status",
      sortField: "status",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row, table }) => {
      const status = row.getValue("status") as string;
      const scheduledAt = row.original.scheduledAt;

      if (status === "scheduled" && scheduledAt) {
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <InvoiceStatus status={status as any} />
              </TooltipTrigger>
              <TooltipContent
                className="text-xs py-1 px-2"
                side="right"
                sideOffset={5}
              >
                Scheduled to send:{" "}
                {format(
                  scheduledAt,
                  `MMM d, ${table.options.meta?.timeFormat === 24 ? "HH:mm" : "h:mm a"}`,
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return <InvoiceStatus status={status as any} />;
    },
  },
  {
    id: "dueDate",
    header: "Due date",
    accessorKey: "dueDate",
    size: 140,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Due date",
      sortField: "due_date",
      className: "w-[140px] min-w-[120px]",
    },
    cell: ({ row, table }) => {
      const date = row.original.dueDate;

      const showDate =
        row.original.status === "unpaid" || row.original.status === "overdue";

      return (
        <div className="flex flex-col space-y-1">
          <span className="truncate">
            {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
          </span>
          {showDate && (
            <span className="text-xs text-muted-foreground truncate">
              {date ? getDueDateStatus(date as string) : "-"}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "customer",
    header: "Customer",
    accessorKey: "customer",
    size: 220,
    minSize: 160,
    maxSize: 350,
    enableResizing: true,
    meta: {
      skeleton: { type: "avatar-text", width: "w-32" },
      headerLabel: "Customer",
      sortField: "customer",
      className: "w-[220px] min-w-[160px]",
    },
    cell: ({ row }) => {
      const customer = row.original.customer;
      const name = customer?.name || row.original.customerName;
      const viewAt = row.original.viewedAt;
      const customerId = customer?.id || row.original.customerId;
      const { setParams } = useCustomerParams();

      if (!name) return "-";

      const handleCustomerClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (customerId) {
          setParams({
            customerId,
            details: true,
          });
        }
      };

      return (
        <div className="flex items-center space-x-2 min-w-0">
          {customerId ? (
            <button
              type="button"
              onClick={handleCustomerClick}
              className="flex items-center space-x-2 text-left min-w-0"
            >
              <Avatar className="size-5 flex-shrink-0">
                {customer?.website && (
                  <AvatarImageNext
                    src={getWebsiteLogo(customer?.website)}
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
            </button>
          ) : (
            <>
              <Avatar className="size-5 flex-shrink-0">
                {customer?.website && (
                  <AvatarImageNext
                    src={getWebsiteLogo(customer?.website)}
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
            </>
          )}

          {viewAt && row.original.status !== "paid" && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger className="flex items-center space-x-2 flex-shrink-0">
                  <Icons.Visibility className="size-4 text-[#878787]" />
                </TooltipTrigger>
                <TooltipContent
                  className="text-xs py-1 px-2"
                  side="right"
                  sideOffset={5}
                >
                  {viewAt
                    ? `Viewed ${formatDistanceToNow(new Date(viewAt))} ago`
                    : ""}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    id: "amount",
    header: "Amount",
    accessorKey: "amount",
    size: 140,
    minSize: 100,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Amount",
      sortField: "amount",
      className: "w-[140px] min-w-[100px]",
    },
    cell: ({ row }) => {
      if (!row.original.amount) return "-";
      return (
        <span
          className={cn("flex items-center gap-2 truncate", {
            "line-through": row.original.status === "canceled",
          })}
        >
          <FormatAmount
            amount={row.original.amount}
            currency={row.original.currency ?? "USD"}
          />
        </span>
      );
    },
  },
  {
    id: "vatRate",
    header: "VAT Rate",
    accessorKey: "vatRate",
    size: 100,
    minSize: 80,
    maxSize: 150,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-12" },
      headerLabel: "VAT Rate",
      className: "w-[100px] min-w-[80px]",
    },
    cell: ({ row }) => {
      // @ts-expect-error template is a jsonb field
      const vatRate = row.original.template.vatRate as number | undefined;
      const value =
        vatRate !== undefined && vatRate !== null ? `${vatRate}%` : "-";
      return (
        <span
          className={cn("truncate", {
            "line-through": row.original.status === "canceled",
          })}
        >
          {value}
        </span>
      );
    },
  },
  {
    id: "vatAmount",
    header: "VAT Amount",
    accessorKey: "vatAmount",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "VAT Amount",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <span
        className={cn("truncate", {
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={(row.original?.vat as number) ?? null}
          currency={row.original.currency ?? "USD"}
          maximumFractionDigits={2}
        />
      </span>
    ),
  },
  {
    id: "taxRate",
    header: "Tax Rate",
    accessorKey: "taxRate",
    size: 100,
    minSize: 80,
    maxSize: 150,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-12" },
      headerLabel: "Tax Rate",
      className: "w-[100px] min-w-[80px]",
    },
    cell: ({ row }) => {
      // @ts-expect-error template is a jsonb field
      const taxRate = row.original.template.taxRate as number | undefined;
      const value =
        taxRate !== undefined && taxRate !== null ? `${taxRate}%` : "-";
      return (
        <span
          className={cn("truncate", {
            "line-through": row.original.status === "canceled",
          })}
        >
          {value}
        </span>
      );
    },
  },
  {
    id: "taxAmount",
    header: "Tax Amount",
    accessorKey: "taxAmount",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Tax Amount",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <span
        className={cn("truncate", {
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={(row.original.tax as number) ?? null}
          currency={row.original.currency ?? "USD"}
          maximumFractionDigits={2}
        />
      </span>
    ),
  },
  {
    id: "exclVat",
    header: "Excl. VAT",
    accessorKey: "exclVat",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Excl. VAT",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <span
        className={cn("truncate", {
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={
            (row.original.amount as number) - (row.original.vat as number)
          }
          currency={row.original.currency ?? "USD"}
        />
      </span>
    ),
  },
  {
    id: "exclTax",
    header: "Excl. Tax",
    accessorKey: "exclTax",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Excl. Tax",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <span
        className={cn("truncate", {
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={
            (row.original.amount as number) - (row.original.tax as number)
          }
          currency={row.original.currency ?? "USD"}
        />
      </span>
    ),
  },
  {
    id: "internalNote",
    header: "Internal Note",
    accessorKey: "internalNote",
    size: 180,
    minSize: 120,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Internal Note",
      className: "w-[180px] min-w-[120px]",
    },
    cell: ({ row }) => {
      return <span className="truncate">{row.original.internalNote}</span>;
    },
  },
  {
    id: "issueDate",
    header: "Issue date",
    accessorKey: "issueDate",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Issue date",
      sortField: "issue_date",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row, table }) => {
      const date = row.original.issueDate;
      return (
        <span className="truncate">
          {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
        </span>
      );
    },
  },
  {
    id: "sentAt",
    header: "Sent at",
    accessorKey: "sentAt",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Sent at",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row, table }) => {
      const sentAt = row.original.sentAt;
      const sentTo = row.original.sentTo;

      if (!sentAt) {
        return "-";
      }

      if (!sentTo) {
        return (
          <span className="truncate">
            {formatDate(sentAt, table.options.meta?.dateFormat)}
          </span>
        );
      }

      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger className="flex items-center space-x-2">
              <span className="truncate">
                {formatDate(sentAt, table.options.meta?.dateFormat)}
              </span>
            </TooltipTrigger>
            <TooltipContent
              className="text-xs py-1 px-2"
              side="right"
              sideOffset={5}
            >
              {sentTo}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    size: 100,
    minSize: 80,
    maxSize: 100,
    enableResizing: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "Actions",
      className:
        "w-[100px] min-w-[80px] md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 justify-center !border-l !border-border",
    },
    cell: ({ row }) => {
      return <ActionsMenu row={row.original} />;
    },
  },
];
