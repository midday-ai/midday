# Midday AI - Status Patterns & UI Component Reference

> Fetched 2026-02-26 from https://github.com/midday-ai/midday (main branch)

---

## Table of Contents

1. [Component Directory Listing](#1-component-directory-listing)
2. [Status Components](#2-status-components)
   - [InvoiceStatus](#21-invoicestatus)
   - [OrderStatus](#22-orderstatus)
   - [TrackerStatus](#23-trackerstatus)
   - [TransactionStatus](#24-transactionstatus)
   - [InboxStatus](#25-inboxstatus)
   - [OAuthApplicationStatusBadge](#26-oauthapplicationstatusbadge)
   - [ConnectionStatus](#27-connectionstatus)
   - [ExportStatus](#28-exportstatus)
   - [AnimatedStatus](#29-animatedstatus)
   - [ChatStatusIndicators](#210-chatstatusindicators)
   - [StatusBadge (Workbench)](#211-statusbadge-workbench)
   - [Invoice OG Template Status](#212-invoice-og-template-status)
3. [UI Package Components](#3-ui-package-components)
   - [Sheet](#31-sheet)
   - [Popover](#32-popover)
   - [Form](#33-form)
   - [Spinner](#34-spinner)
   - [Loader](#35-loader)
   - [Badge](#36-badge)
   - [Icons (excerpt)](#37-icons-excerpt)
4. [Utility: Connection Status](#4-utility-connection-status)
5. [Analysis: Status Capitalization Patterns](#5-analysis-status-capitalization-patterns)
6. [Analysis: Color System](#6-analysis-color-system)

---

## 1. Component Directory Listing

**Source:** `packages/ui/src/components/` (76 files)

```
accordion.tsx          actions.tsx             alert-dialog.tsx
alert.tsx              animated-size-container.tsx  animations/
avatar.tsx             badge.tsx               branch.tsx
button.tsx             calendar.tsx            card.tsx
carousel.tsx           chart.tsx               checkbox.tsx
code-block.tsx         collapsible.tsx         combobox-dropdown.tsx
combobox.tsx           command.tsx             context-menu.tsx
conversation.tsx       currency-input.tsx      date-range-picker.tsx
dialog.tsx             drawer.tsx              dropdown-menu.tsx
editor/                email-tag-input.tsx     form.tsx
hover-card.tsx         icons.tsx               image.tsx
inline-citation.tsx    input-otp.tsx           input.tsx
label.tsx              loader.tsx              message.tsx
multiple-selector.tsx  navigation-menu.tsx     popover.tsx
progress.tsx           prompt-input.tsx        quantity-input.tsx
radio-group.tsx        reasoning.tsx           record-button.tsx
response.tsx           scroll-area.tsx         select.tsx
separator.tsx          sheet.tsx               skeleton.tsx
slider.tsx             sources.tsx             spinner.tsx
submit-button-morph.tsx  submit-button.tsx     suggestion.tsx
switch.tsx             table.tsx               tabs.tsx
task.tsx               text-effect.tsx         text-morph.tsx
text-shimmer.tsx       textarea.tsx            time-range-input.tsx
toast.tsx              toaster.tsx             tool-call-indicator.tsx
tool.tsx               tooltip.tsx             use-toast.tsx
```

**Status-related files across the entire repo:**

```
apps/api/src/ai/tools/get-timer-status.ts
apps/dashboard/src/components/animated-status.tsx
apps/dashboard/src/components/chat/chat-status-indicators.tsx
apps/dashboard/src/components/connection-status.tsx
apps/dashboard/src/components/export-status.tsx
apps/dashboard/src/components/inbox/inbox-status.tsx
apps/dashboard/src/components/invoice-status.tsx
apps/dashboard/src/components/oauth-application-status-badge.tsx
apps/dashboard/src/components/onboarding/onboarding-sync-status.tsx
apps/dashboard/src/components/order-status.tsx
apps/dashboard/src/components/tracker-status.tsx
apps/dashboard/src/components/transaction-status.tsx
apps/dashboard/src/hooks/use-chat-status.ts
apps/dashboard/src/hooks/use-export-status.ts
apps/dashboard/src/hooks/use-global-timer-status.ts
apps/dashboard/src/hooks/use-initial-connection-status.ts
apps/dashboard/src/hooks/use-job-status.ts
apps/dashboard/src/hooks/use-sync-status.ts
apps/dashboard/src/utils/connection-status.ts
packages/invoice/src/templates/og/components/status.tsx
packages/jobs/src/tasks/invoice/operations/check-status.ts
packages/workbench/src/ui/components/shared/status-badge.tsx
```

---

## 2. Status Components

### 2.1 InvoiceStatus

**File:** `apps/dashboard/src/components/invoice-status.tsx`

```tsx
"use client";

import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { useI18n } from "@/locales/client";

export function InvoiceStatus({
  status,
  isLoading,
  className,
  textOnly = false,
}: {
  status?:
    | "draft"
    | "overdue"
    | "paid"
    | "unpaid"
    | "canceled"
    | "scheduled"
    | "refunded";
  isLoading?: boolean;
  className?: string;
  textOnly?: boolean;
}) {
  const t = useI18n();

  if (isLoading) {
    return <Skeleton className="w-24 h-6 rounded-full" />;
  }

  if (!status) {
    return null;
  }

  // Text-only mode for PDF rendering
  if (textOnly) {
    return (
      <span
        className={cn(
          (status === "draft" || status === "canceled") &&
            "text-[#878787] dark:text-[#878787]",
          status === "overdue" && "text-[#FFD02B] dark:text-[#FFD02B]",
          status === "paid" && "text-[#00C969] dark:text-[#00C969]",
          status === "unpaid" && "text-[#1D1D1D] dark:text-[#F5F5F3]",
          status === "scheduled" && "text-[#1F6FEB] dark:text-[#1F6FEB]",
          status === "refunded" && "text-[#F97316] dark:text-[#F97316]",
          className,
        )}
      >
        {t(`invoice_status.${status}`)}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full cursor-default inline-flex max-w-full text-[11px]",
        (status === "draft" || status === "canceled") &&
          "text-[#878787] bg-[#F2F1EF] text-[10px] dark:text-[#878787] dark:bg-[#1D1D1D]",
        status === "overdue" &&
          "bg-[#FFD02B]/10 text-[#FFD02B] dark:bg-[#FFD02B]/10 dark:text-[#FFD02B]",
        status === "paid" &&
          "text-[#00C969] bg-[#DDF1E4] dark:text-[#00C969] dark:bg-[#00C969]/10",
        status === "unpaid" &&
          "text-[#1D1D1D] bg-[#878787]/10 dark:text-[#F5F5F3] dark:bg-[#F5F5F3]/10",
        status === "scheduled" &&
          "text-[#1F6FEB] bg-[#DDEBFF] dark:text-[#1F6FEB] dark:bg-[#1F6FEB]/10",
        status === "refunded" &&
          "text-[#F97316] bg-[#FFEDD5] dark:text-[#F97316] dark:bg-[#F97316]/10",
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {t(`invoice_status.${status}`)}
      </span>
    </div>
  );
}
```

**Key observations:**
- Uses i18n for label rendering (`t("invoice_status.${status}")`)
- Two modes: pill badge (default) and textOnly (for PDF)
- Statuses stored as lowercase enum: `draft | overdue | paid | unpaid | canceled | scheduled | refunded`
- Loading state uses `<Skeleton>` with rounded-full
- Pill badge: `px-2 py-0.5 rounded-full text-[11px]`

---

### 2.2 OrderStatus

**File:** `apps/dashboard/src/components/order-status.tsx`

```tsx
"use client";

import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";

export function OrderStatus({
  status,
  isLoading,
  className,
}: {
  status?: string;
  isLoading?: boolean;
  className?: string;
}) {
  if (isLoading) {
    return <Skeleton className="w-24 h-6 rounded-full" />;
  }

  if (!status) {
    return null;
  }

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full cursor-default inline-flex max-w-full text-[11px]",
        status === "paid" &&
          "text-[#00C969] bg-[#DDF1E4] dark:text-[#00C969] dark:bg-[#00C969]/10",
        status === "pending" &&
          "bg-[#FFD02B]/10 text-[#FFD02B] dark:bg-[#FFD02B]/10 dark:text-[#FFD02B]",
        (status === "cancelled" || status === "canceled") &&
          "text-[#878787] bg-[#F2F1EF] text-[10px] dark:text-[#878787] dark:bg-[#1D1D1D]",
        status === "failed" &&
          "text-[#1D1D1D] bg-[#878787]/10 dark:text-[#F5F5F3] dark:bg-[#F5F5F3]/10",
        status === "refunded" &&
          "text-[#878787] bg-[#F2F1EF] text-[10px] dark:text-[#878787] dark:bg-[#1D1D1D]",
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block capitalize">
        {status}
      </span>
    </div>
  );
}
```

**Key observations:**
- Uses CSS `capitalize` on the raw status string (no i18n)
- Handles both "cancelled" and "canceled" spellings
- Same pill shape: `px-2 py-0.5 rounded-full text-[11px]`

---

### 2.3 TrackerStatus

**File:** `apps/dashboard/src/components/tracker-status.tsx`

```tsx
"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { useI18n } from "@/locales/client";

type Props = {
  status: NonNullable<RouterOutputs["trackerProjects"]["getById"]>["status"];
};

export function TrackerStatus({ status }: Props) {
  const t = useI18n();

  return (
    <div className="flex items-center space-x-4">
      <div
        className={cn(
          "w-[6px] h-[6px] rounded-full bg-[#FFD02B]",
          status === "completed" && "bg-primary",
        )}
      />
      {/* @ts-expect-error */}
      <span>{t(`tracker_status.${status}`)}</span>
    </div>
  );
}
```

**Key observations:**
- Uses a small colored dot (6px) + text label
- Not a pill badge -- just dot + text side by side
- Default dot = yellow (#FFD02B), completed = primary color
- i18n for text labels

---

### 2.4 TransactionStatus

**File:** `apps/dashboard/src/components/transaction-status.tsx`

```tsx
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { format } from "date-fns";

const ERROR_MESSAGES: Record<string, string> = {
  FINANCIAL_YEAR_MISSING: "Financial year not set up in your accounting software",
  FINANCIAL_YEAR_SETUP_REQUIRED: "Please set up financial years in your accounting software first",
  AUTH_EXPIRED: "Connection expired — please reconnect your accounting software",
  RATE_LIMIT: "Too many requests — will retry automatically",
  VALIDATION: "Invalid data format",
  NOT_FOUND: "Resource not found in accounting software",
  SERVER_ERROR: "Accounting software is temporarily unavailable",
  ATTACHMENT_UNSUPPORTED_TYPE: "Attachment file type not supported",
  ATTACHMENT_TOO_LARGE: "Attachment file is too large",
  ATTACHMENT_TIMEOUT: "Attachment upload timed out",
  ATTACHMENT_UPLOAD_FAILED: "Failed to upload attachment",
  ATTACHMENT_NOT_FOUND: "Attachment file not found",
  UNKNOWN: "An unexpected error occurred",
};

const PROVIDER_NAMES: Record<string, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks",
  fortnox: "Fortnox",
};

const PROVIDER_ICONS: Record<string, React.FC<{ className?: string }>> = {
  xero: Icons.Xero,
  quickbooks: Icons.QuickBooks,
  fortnox: Icons.Fortnox,
};

function getErrorMessage(code?: string | null): string {
  if (!code) return ERROR_MESSAGES.UNKNOWN as string;
  return (ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN) as string;
}

function getProviderName(provider?: string | null): string {
  if (!provider) return "accounting software";
  return (PROVIDER_NAMES[provider] ?? provider) as string;
}

function formatExportDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "MMM d, yyyy, h:mm a");
  } catch {
    return dateStr;
  }
}

type Props = {
  isFulfilled: boolean;
  isExported: boolean;
  hasExportError?: boolean;
  exportErrorCode?: string | null;
  exportProvider?: string | null;
  exportedAt?: string | null;
  hasPendingSuggestion?: boolean;
};

export function TransactionStatus({
  isFulfilled,
  isExported,
  hasExportError,
  exportErrorCode,
  exportProvider,
  exportedAt,
  hasPendingSuggestion,
}: Props) {
  // Priority: Export error > In review > Receipt match > Exported

  if (hasExportError && !isExported) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span style={{ color: "#f44336" }} className="cursor-default">
              Export error
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>{getErrorMessage(exportErrorCode)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isFulfilled && !isExported) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">In review</span>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>Receipt attached and categorized —<br />ready to export</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (hasPendingSuggestion) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span style={{ color: "#ff9800" }} className="cursor-default">
              Receipt match
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>We found a possible match — confirm <br />or dismiss it</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isExported) {
    const ProviderIcon = exportProvider ? PROVIDER_ICONS[exportProvider] : null;
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">Exported</span>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span>Exported to</span>
                {ProviderIcon && <ProviderIcon className="size-4" />}
                <span>{getProviderName(exportProvider)}</span>
              </div>
              {exportedAt && (
                <span className="text-[11px] text-muted-foreground">
                  {formatExportDate(exportedAt)}
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
```

**Key observations:**
- NOT a pill badge -- uses plain text with tooltips
- Boolean-based logic, not enum-based
- Priority order: Export error > In review > Receipt match > Exported
- Hardcoded color strings (`#f44336`, `#ff9800`) instead of Tailwind tokens
- Rich tooltips with provider icons and export timestamps

---

### 2.5 InboxStatus

**File:** `apps/dashboard/src/components/inbox/inbox-status.tsx`

```tsx
"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";

type Props = {
  item: RouterOutputs["inbox"]["get"]["data"][number];
};

export function InboxStatus({ item }: Props) {
  if (item.status === "processing" || item.status === "new") {
    return null;
  }

  if (item.status === "other" || item.type === "other") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1.5 items-center px-1.5 py-0.5 text-[10px] cursor-default border text-muted-foreground">
              <span>Document</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>This document isn't an invoice or receipt — <br />no transaction matching required</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "analyzing") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1 items-center p-1 text-[#878787] text-[10px] px-1.5 py-0.5 cursor-default border">
              <Spinner size={14} className="stroke-primary" />
              <span>Analyzing</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>We're reviewing the file and checking <br />for a matching transaction</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "suggested_match") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1.5 items-center px-1.5 py-0.5 text-[10px] cursor-default border">
              <div className="w-1.5 h-1.5 bg-[#FFD02B] rounded-full" />
              <span>Suggested match</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>We found a possible match — confirm <br />or dismiss it</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "pending") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-1 text-[10px] px-1.5 py-0.5 cursor-default inline-block border">
              <span>Pending</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>We didn't find a match yet — we'll check <br />again when new transactions arrive</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "done" || item?.transactionId) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1 items-center px-1.5 py-0.5 text-[10px] cursor-default border">
              <Icons.Check className="size-3.5 mt-[1px]" />
              <span>Matched</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>This file has been successfully <br />matched to a transaction</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex space-x-1 items-center px-1.5 py-0.5 text-[10px] cursor-default border">
            <span>No match</span>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={10} className="text-xs">
          <p>We couldn't find a match — please <br />select the transaction manually</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**Key observations:**
- Uses bordered box badges (not rounded-full pills)
- `px-1.5 py-0.5 text-[10px] border` is the consistent pattern
- Includes animated `<Spinner>` for "analyzing" state
- Uses check icon for "done/matched" state
- Yellow dot (1.5px) for "suggested_match"
- Every status has a tooltip with a user-friendly explanation

---

### 2.6 OAuthApplicationStatusBadge

**File:** `apps/dashboard/src/components/oauth-application-status-badge.tsx`

```tsx
import { cn } from "@midday/ui/cn";

type OAuthApplicationStatus =
  | "approved"
  | "rejected"
  | "pending"
  | "draft"
  | null;

type Props = {
  status: OAuthApplicationStatus;
  className?: string;
};

export function OAuthApplicationStatusBadge({ status, className }: Props) {
  const getStatusColor = (status: OAuthApplicationStatus) => {
    switch (status) {
      case "approved":
        return "dark:bg-green-900 dark:text-green-300 text-green-600 bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
      case "draft":
        return "text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D]";
      default:
        return "text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D]";
    }
  };

  return (
    <div
      className={cn(
        "text-[10px] px-3 py-1 rounded-full capitalize",
        getStatusColor(status),
        className,
      )}
    >
      {status === "pending" ? "Reviewing" : status}
    </div>
  );
}
```

**Key observations:**
- CSS `capitalize` used for display
- "pending" is remapped to "Reviewing" display label
- Uses Tailwind color tokens (green-*, red-*, amber-*) unlike most other status components
- Pill style: `px-3 py-1 rounded-full text-[10px]`

---

### 2.7 ConnectionStatus

**File:** `apps/dashboard/src/components/connection-status.tsx`

```tsx
"use client";

import { Button } from "@midday/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BankLogo } from "@/components/bank-logo";
import { useTRPC } from "@/trpc/client";
import {
  buildConnectionIssues,
  type ConnectionIssue,
  getHighestSeverity,
} from "@/utils/connection-status";

function IssueLogo({ issue }: { issue: ConnectionIssue }) {
  if (issue.type === "bank") {
    return <BankLogo src={issue.logoUrl ?? null} alt={issue.title} size={20} />;
  }
  if (issue.provider === "gmail") return <Icons.Gmail className="size-5" />;
  if (issue.provider === "outlook") return <Icons.Outlook className="size-5" />;
  return null;
}

function IssueRow({ issue }: { issue: ConnectionIssue }) {
  return (
    <Link
      href={issue.path}
      className="flex items-center justify-between gap-3 py-2.5 px-4 hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0">
          <IssueLogo issue={issue} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{issue.title}</p>
          <p className="text-[11px] text-muted-foreground">{issue.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground shrink-0">
        {issue.linkText}
        <Icons.ChevronRight className="size-3" />
      </div>
    </Link>
  );
}

const FETCH_DELAY_MS = 500;

export function ConnectionStatus() {
  const trpc = useTRPC();
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShouldFetch(true), FETCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading } = useQuery({
    ...trpc.team.connectionStatus.queryOptions(),
    enabled: shouldFetch,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const issues = useMemo(() => buildConnectionIssues(data), [data]);
  const severity = getHighestSeverity(issues);

  if (!shouldFetch || isLoading || issues.length === 0) return null;

  const iconColor = severity === "error" ? "text-[#FF3638]" : "text-[#FFD02B]";

  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 items-center hidden md:flex"
        >
          <Icons.Error size={16} className={iconColor} />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-[320px] p-0" align="end" sideOffset={10}>
        <div className="px-4 py-2.5 border-b">
          <p className="text-[11px] font-medium text-muted-foreground">
            Connection Issues
          </p>
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {issues.map((issue) => (
            <IssueRow key={`${issue.type}-${issue.title}`} issue={issue} />
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

**Key observations:**
- Uses HoverCard (not popover) for issue list
- Severity-based icon color: error = `#FF3638`, warning = `#FFD02B`
- Delayed fetch (500ms) to avoid initial TRPC batch
- Scrollable issue list with `max-h-[280px]`

---

### 2.8 ExportStatus

**File:** `apps/dashboard/src/components/export-status.tsx`

(Full source omitted for brevity -- it is a headless component that manages toast notifications for export progress using `useJobStatus` hook. It returns `null` and controls toasts imperatively.)

**Key pattern:** Uses toast variant `"progress"` with percentage updates, then switches to `"success"` variant on completion. Error uses `"error"` variant.

---

### 2.9 AnimatedStatus

**File:** `apps/dashboard/src/components/animated-status.tsx`

```tsx
"use client";

import { TextShimmer } from "@midday/ui/text-shimmer";
import { AnimatePresence, motion } from "framer-motion";
import type { IconComponent } from "@/lib/tool-config";

interface AnimatedStatusProps {
  text: string | null;
  shimmerDuration?: number;
  className?: string;
  fadeDuration?: number;
  variant?: "fade" | "slide" | "scale" | "blur-fade";
  icon?: IconComponent | null;
}

export function AnimatedStatus({
  text,
  shimmerDuration = 1,
  className,
  fadeDuration = 0.2,
  variant = "fade",
  icon: Icon,
}: AnimatedStatusProps) {
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: 10 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -10 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    "blur-fade": {
      initial: { opacity: 0, filter: "blur(4px)" },
      animate: { opacity: 1, filter: "blur(0px)" },
      exit: { opacity: 0, filter: "blur(4px)" },
    },
  };

  const selectedAnimation = animations[variant];

  return (
    <div className="relative whitespace-nowrap h-8 flex items-center">
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={text}
            initial={selectedAnimation.initial}
            animate={selectedAnimation.animate}
            exit={selectedAnimation.exit}
            transition={{ duration: fadeDuration, ease: "easeInOut" }}
            className="flex items-center gap-1.5 text-muted-foreground dark:text-[#666666]"
          >
            {Icon && <Icon className="h-3 w-3 shrink-0 text-current" />}
            <TextShimmer className={className} duration={shimmerDuration}>
              {text || ""}
            </TextShimmer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Key observations:**
- Uses framer-motion `AnimatePresence` for smooth transitions between status text
- `TextShimmer` component for loading shimmer effect
- 4 animation variants: fade, slide, scale, blur-fade
- Used in chat/AI interactions

---

### 2.10 ChatStatusIndicators

**File:** `apps/dashboard/src/components/chat/chat-status-indicators.tsx`

(Uses AnimatedStatus internally. Shows tool call progress, artifact stages, and agent status messages. Falls back to `<Loader />` when no status message is available.)

---

### 2.11 StatusBadge (Workbench)

**File:** `packages/workbench/src/ui/components/shared/status-badge.tsx`

```tsx
import type { JobStatus } from "@/core/types";
import { cn, formatDuration } from "@/lib/utils";

interface StatusBadgeProps {
  status: JobStatus;
  duration?: number;
  className?: string;
}

const statusConfig: Record<
  JobStatus,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  completed: {
    label: "Completed",
    dotClass: "bg-status-success",
    textClass: "text-status-success",
    bgClass: "bg-status-success/10",
  },
  active: {
    label: "Running",
    dotClass: "bg-status-active",
    textClass: "text-status-active",
    bgClass: "bg-status-active/10",
  },
  waiting: {
    label: "Queued",
    dotClass: "bg-status-pending",
    textClass: "text-status-pending",
    bgClass: "bg-status-pending/10",
  },
  delayed: {
    label: "Delayed",
    dotClass: "bg-status-warning",
    textClass: "text-status-warning",
    bgClass: "bg-status-warning/10",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-status-error",
    textClass: "text-status-error",
    bgClass: "bg-status-error/10",
  },
  paused: {
    label: "Paused",
    dotClass: "bg-status-pending",
    textClass: "text-status-pending",
    bgClass: "bg-status-pending/10",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-status-pending",
    textClass: "text-status-pending",
    bgClass: "bg-status-pending/10",
  },
};

export function StatusBadge({ status, duration, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium",
        config.bgClass,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      <span className={config.textClass}>{config.label}</span>
    </span>
  );
}

export function StatusDot({ status, className }: { status: JobStatus; className?: string }) {
  const config = statusConfig[status] || statusConfig.unknown;
  return <span className={cn("h-2 w-2 rounded-full", config.dotClass, className)} />;
}

export function StatusText({ status, duration, className }: { status: JobStatus; duration?: number; className?: string }) {
  const config = statusConfig[status] || statusConfig.unknown;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("h-2 w-2 rounded-full", config.dotClass)} />
      <span className={cn("text-sm", config.textClass)}>{config.label}</span>
      {duration !== undefined && (
        <span className="text-sm text-muted-foreground">{formatDuration(duration)}</span>
      )}
    </span>
  );
}
```

**Key observations:**
- Most structured/reusable status pattern in the repo
- Config-driven with `statusConfig` lookup table
- Uses semantic Tailwind tokens: `bg-status-success`, `text-status-error`, etc.
- Three variants: `StatusBadge` (pill), `StatusDot` (dot only), `StatusText` (dot + text)
- Labels are Title Case: "Completed", "Running", "Queued", "Delayed", "Failed", "Paused"

---

### 2.12 Invoice OG Template Status

**File:** `packages/invoice/src/templates/og/components/status.tsx`

```tsx
export function Status({
  status,
}: {
  status: "draft" | "overdue" | "paid" | "unpaid" | "canceled" | "scheduled" | "refunded";
}) {
  const getStatusStyles = () => {
    if (status === "draft" || status === "canceled") {
      return "text-[#878787] bg-[#1D1D1D] text-[20px]";
    }
    if (status === "overdue") return "bg-[#262111] text-[#FFD02B]";
    if (status === "paid") return "text-[#00C969] bg-[#17241B]";
    if (status === "scheduled") return "text-[#1F6FEB] bg-[#DDEBFF]";
    if (status === "refunded") return "text-[#F97316] bg-[#3D2612]";
    return "text-[#F5F5F3] bg-[#292928]";
  };

  return (
    <div
      tw={`flex px-4 py-1 rounded-full max-w-full text-[22px] ${getStatusStyles()}`}
      style={{ fontFamily: "hedvig-sans" }}
    >
      <span style={{ fontFamily: "hedvig-sans" }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}
```

**Key observations:**
- Manual capitalization: `status.charAt(0).toUpperCase() + status.slice(1)`
- Uses `tw` prop (Satori/OG image generation)
- Dark-mode-only colors (for OG image backgrounds)

---

## 3. UI Package Components

### 3.1 Sheet

**File:** `packages/ui/src/components/sheet.tsx`

Built on `@radix-ui/react-dialog` with `class-variance-authority` for side variants.

```tsx
const sheetVariants = cva(
  "fixed z-50 gap-4 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 ...",
        bottom: "inset-x-0 bottom-0 ...",
        left: "inset-y-0 left-0 h-full w-3/4 ... sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 ... sm:max-w-[520px]",
      },
    },
    defaultVariants: { side: "right" },
  },
);
```

- Right-side sheet max width: `520px`
- Overlay: `bg-[#f6f6f3]/60 dark:bg-black/60`
- Content wrapper: `bg-[#FAFAF9] dark:bg-[#0C0C0C] p-6 border`
- Prevents auto-focus on open: `onOpenAutoFocus={(e) => e.preventDefault()}`

### 3.2 Popover

**File:** `packages/ui/src/components/popover.tsx`

Built on `@radix-ui/react-popover`. Supports optional `portal` prop (default true).

```tsx
<PopoverPrimitive.Content
  className={cn(
    "z-50 w-72 border bg-background p-4 text-popover-foreground shadow-md outline-none
     data-[state=open]:animate-in data-[state=closed]:animate-out
     data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
     data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
     data-[side=bottom]:slide-in-from-top-2 ...",
    className,
  )}
/>
```

### 3.3 Form

**File:** `packages/ui/src/components/form.tsx`

Standard react-hook-form integration with Radix Label. Exports: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`.

### 3.4 Spinner

**File:** `packages/ui/src/components/spinner.tsx`

```tsx
export const Spinner = ({ className, size = 20, style, ...props }: SpinnerProps) => {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      className={cn("animate-spin stroke-[#878787]", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <path d="M12 3v3m6.366-.366-2.12 2.12M21 12h-3m.366 6.366-2.12-2.12M12 21v-3m-6.366.366 2.12-2.12M3 12h3m-.366-6.366 2.12 2.12" />
    </svg>
  );
};
```

- Default size: 20px
- Uses CSS `animate-spin`
- Default stroke color: `#878787`

### 3.5 Loader

**File:** `packages/ui/src/components/loader.tsx`

```tsx
export const Loader = ({ className, size = 16, ...props }: LoaderProps) => (
  <div className={cn("inline-flex animate-spin items-center justify-center", className)} {...props}>
    <LoaderIcon size={size} />
  </div>
);
```

- Default size: 16px
- SVG with opacity-based segments (clock-like spinner)
- Uses CSS `animate-spin`

### 3.6 Badge

**File:** `packages/ui/src/components/badge.tsx`

```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "rounded-none bg-transparent text-[10px] font-normal border-border border text-primary",
        tag: "text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D] border-none font-normal rounded-none",
        "tag-rounded": "text-[#878787] bg-[#F2F1EF] text-[12px] dark:bg-[#1D1D1D] font-normal px-3 py-1 border-none",
        "tag-outline": "border-transparent bg-zinc-700 text-zinc-200 hover:bg-zinc-700/80",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
```

- 7 variants: default, secondary, destructive, outline, tag, tag-rounded, tag-outline
- `outline` and `tag` use `rounded-none` (not pills)
- `tag` uses the Midday gray: `#878787` text, `#F2F1EF` bg

### 3.7 Icons (excerpt)

**File:** `packages/ui/src/components/icons.tsx` (first 200 lines)

- Uses `react-icons/md` (Material Design) as primary icon source
- Also uses `@radix-ui/react-icons` and `react-icons/pi`
- Custom SVG wrapper component `SVGIcon` with default size 20px
- Exports single `Icons` object with named icon components
- Pattern: `Icons.LogoSmall`, `Icons.Logo`, `Icons.Apps`, `Icons.Transactions`, etc.

---

## 4. Utility: Connection Status

**File:** `apps/dashboard/src/utils/connection-status.ts`

Defines `ConnectionIssue` type with:
- `type: "bank" | "inbox"`
- `severity: "error" | "warning"`
- Threshold constants: `DISPLAY_DAYS=30`, `WARNING_DAYS=14`, `ERROR_DAYS=7`

Expiration logic:
- `<= 0 days` = expired (error)
- `<= 7 days` = error severity
- `<= 14 days` = warning severity
- `<= 30 days` = show notification

---

## 5. Analysis: Status Capitalization Patterns

| Component | Capitalization Method | Example |
|---|---|---|
| **InvoiceStatus** | i18n translation key (`t("invoice_status.${status}")`) | Localized |
| **OrderStatus** | CSS `capitalize` on raw lowercase string | "paid" -> "Paid" |
| **TrackerStatus** | i18n translation key | Localized |
| **TransactionStatus** | Hardcoded display strings | "Export error", "In review" |
| **InboxStatus** | Hardcoded display strings | "Analyzing", "Suggested match", "Pending", "Matched", "No match" |
| **OAuthStatusBadge** | CSS `capitalize` + remapping ("pending" -> "Reviewing") | "approved" -> "Approved" |
| **Invoice OG Status** | Manual JS: `status.charAt(0).toUpperCase() + status.slice(1)` | "draft" -> "Draft" |
| **StatusBadge (Workbench)** | Config-driven labels (Title Case) | "Completed", "Running", "Queued" |

**Summary:** Midday stores statuses as **lowercase** in the database/API. Display capitalization is handled at the component level through three approaches:
1. **i18n translation** (most common in invoice/tracker)
2. **CSS `capitalize`** (order status, OAuth badge)
3. **Config-driven Title Case labels** (workbench status badge -- most structured)

---

## 6. Analysis: Color System

### Consistent Status Colors (used across multiple components)

| Semantic Meaning | Hex Color | Usage |
|---|---|---|
| **Success / Paid** | `#00C969` | InvoiceStatus, OrderStatus, OG template |
| **Success bg (light)** | `#DDF1E4` | InvoiceStatus, OrderStatus (light mode) |
| **Warning / Overdue / Pending** | `#FFD02B` | InvoiceStatus, OrderStatus, TrackerStatus, InboxStatus, ConnectionStatus |
| **Warning bg** | `#FFD02B/10` | InvoiceStatus, OrderStatus (10% opacity) |
| **Muted / Draft / Canceled** | `#878787` | InvoiceStatus, OrderStatus, OAuthBadge, Spinner, Badge tag, InboxStatus |
| **Muted bg (light)** | `#F2F1EF` | InvoiceStatus, OrderStatus, OAuthBadge, Badge tag |
| **Muted bg (dark)** | `#1D1D1D` | InvoiceStatus, OrderStatus, OAuthBadge, Badge tag |
| **Info / Scheduled** | `#1F6FEB` | InvoiceStatus, OG template |
| **Info bg (light)** | `#DDEBFF` | InvoiceStatus, OG template |
| **Orange / Refunded** | `#F97316` | InvoiceStatus, OG template |
| **Orange bg (light)** | `#FFEDD5` | InvoiceStatus |
| **Error (connection)** | `#FF3638` | ConnectionStatus |
| **Error (transaction)** | `#f44336` | TransactionStatus |
| **Warning (transaction)** | `#ff9800` | TransactionStatus |
| **Neutral text (light)** | `#1D1D1D` | InvoiceStatus (unpaid) |
| **Neutral text (dark)** | `#F5F5F3` | InvoiceStatus (unpaid), OG template |
| **Background (light)** | `#FAFAF9` | Sheet content |
| **Background (dark)** | `#0C0C0C` | Sheet content |

### Workbench Semantic Tokens

The workbench package uses Tailwind CSS custom properties (most structured approach):
- `bg-status-success` / `text-status-success`
- `bg-status-active` / `text-status-active`
- `bg-status-pending` / `text-status-pending`
- `bg-status-warning` / `text-status-warning`
- `bg-status-error` / `text-status-error`

### Common Pill Badge Dimensions

| Context | Padding | Font Size | Border Radius |
|---|---|---|---|
| InvoiceStatus / OrderStatus | `px-2 py-0.5` | `text-[11px]` (or `text-[10px]` for draft/canceled) | `rounded-full` |
| OAuthBadge | `px-3 py-1` | `text-[10px]` | `rounded-full` |
| InboxStatus | `px-1.5 py-0.5` | `text-[10px]` | None (square borders) |
| WorkbenchStatusBadge | `px-2 py-0.5` | `text-[11px]` | None |
| Badge (default) | `px-2.5 py-0.5` | `text-xs` | `rounded-full` |

---

*End of reference document.*
