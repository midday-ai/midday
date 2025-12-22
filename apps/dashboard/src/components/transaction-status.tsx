import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { format } from "date-fns";

/**
 * User-friendly error messages for each error code
 */
const ERROR_MESSAGES: Record<string, string> = {
  FINANCIAL_YEAR_MISSING:
    "Financial year not set up in your accounting software",
  FINANCIAL_YEAR_SETUP_REQUIRED:
    "Please set up financial years in your accounting software first",
  AUTH_EXPIRED:
    "Connection expired — please reconnect your accounting software",
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

/**
 * Provider display names
 */
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

  // Show "Export error" in red if export failed or partially failed
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
            <p>
              Receipt attached and categorized —<br />
              ready to export
            </p>
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
            <p>
              We found a possible match — confirm <br />
              or dismiss it
            </p>
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
