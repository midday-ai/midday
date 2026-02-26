"use client";

import { FormatAmount } from "@/components/format-amount";
import { DealStatus } from "@/components/deal-status";
import { useMerchantParams } from "@/hooks/use-merchant-params";
import { getDueDateStatus } from "@/utils/format";
import { getWebsiteLogo } from "@/utils/logos";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
import { getFrequencyShortLabel } from "@midday/deal/recurring";
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

/**
 * Format a date stored as UTC midnight (e.g., "2024-01-15T00:00:00.000Z") to display
 * the correct date regardless of user's timezone.
 */
function formatDateUTC(date: string, dateFormat?: string | null): string {
  const tzDate = new TZDate(date, "UTC");
  // Check if same year for short format
  const now = new Date();
  if (tzDate.getUTCFullYear() === now.getUTCFullYear()) {
    return format(tzDate, "MMM d");
  }
  return format(tzDate, dateFormat ?? "P");
}

export type Deal = NonNullable<
  RouterOutputs["deal"]["get"]["data"]
>[number];

export const columns: ColumnDef<Deal>[] = [
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
    id: "dealNumber",
    header: "Deal no.",
    accessorKey: "dealNumber",
    size: 180,
    minSize: 140,
    maxSize: 300,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Deal no.",
      sortField: "deal_number",
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
        {row.getValue("dealNumber")}
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
                <DealStatus status={status as any} />
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

      return <DealStatus status={status as any} />;
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
            {date ? formatDateUTC(date, table.options.meta?.dateFormat) : "-"}
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
    id: "merchant",
    header: "Merchant",
    accessorKey: "merchant",
    size: 220,
    minSize: 160,
    maxSize: 350,
    enableResizing: true,
    meta: {
      skeleton: { type: "avatar-text", width: "w-32" },
      headerLabel: "Merchant",
      sortField: "merchant",
      className: "w-[220px] min-w-[160px]",
    },
    cell: ({ row }) => {
      const merchant = row.original.merchant;
      const name = merchant?.name || row.original.merchantName;
      const viewAt = row.original.viewedAt;
      const merchantId = merchant?.id || row.original.merchantId;
      const { setParams } = useMerchantParams();

      if (!name) return "-";

      const handleMerchantClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (merchantId) {
          setParams({
            merchantId,
            details: true,
          });
        }
      };

      return (
        <div className="flex items-center space-x-2 min-w-0">
          {merchantId ? (
            <button
              type="button"
              onClick={handleMerchantClick}
              className="flex items-center space-x-2 text-left min-w-0"
            >
              <Avatar className="size-5 flex-shrink-0">
                {merchant?.website && (
                  <AvatarImageNext
                    src={getWebsiteLogo(merchant?.website)}
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
                {merchant?.website && (
                  <AvatarImageNext
                    src={getWebsiteLogo(merchant?.website)}
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
          {date ? formatDateUTC(date, table.options.meta?.dateFormat) : "-"}
        </span>
      );
    },
  },
  {
    id: "type",
    header: "Type",
    accessorKey: "dealRecurringId",
    size: 140,
    minSize: 100,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Type",
      className: "w-[140px] min-w-[100px]",
    },
    cell: ({ row }) => {
      const recurringId = row.original.dealRecurringId;
      const recurring = row.original.recurring;
      const dealStatus = row.original.status;
      const sequence = row.original.recurringSequence;

      if (!recurringId || !recurring) {
        return <span>One-time</span>;
      }

      const frequencyLabel = getFrequencyShortLabel(
        recurring.frequency,
        recurring.frequencyInterval,
      );
      const nextDate = recurring.nextScheduledAt;
      const endCount = recurring.endCount;

      // For scheduled deals that are the first in the series,
      // show "Sends on" instead of "Next on" since THIS deal is the scheduled one
      const isFirstScheduled =
        dealStatus === "scheduled" &&
        sequence === 1 &&
        recurring.dealsGenerated === 0;

      // For sent/paid deals, show the sequence info instead of "Next on"
      const isAlreadySent = ["unpaid", "paid", "overdue"].includes(
        dealStatus,
      );

      // Build the subtitle based on context
      let subtitle: string | null = null;
      if (isAlreadySent && sequence) {
        // Show sequence info for sent deals
        subtitle = endCount ? `${sequence} of ${endCount}` : `${sequence}`;
      } else if (recurring.status === "active" && nextDate) {
        subtitle = isFirstScheduled
          ? `Sends on ${format(new TZDate(nextDate, "UTC"), "MMM d")}`
          : `Next on ${format(new TZDate(nextDate, "UTC"), "MMM d")}`;
      } else if (recurring.status === "paused") {
        subtitle = "Paused";
      } else if (recurring.status === "completed") {
        subtitle = "Completed";
      } else if (recurring.status === "canceled") {
        subtitle = "Canceled";
      }

      return (
        <div className="flex flex-col">
          <span>{frequencyLabel}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
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
