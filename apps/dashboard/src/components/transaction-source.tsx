import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@midday/ui/tooltip";

type TransactionSourceType = "manual" | "bank_sync" | "import";

type Props = {
  manual: boolean;
  hasAccount: boolean;
  accountName?: string;
  className?: string;
};

const sourceConfig: Record<
  TransactionSourceType,
  {
    label: string;
    description: string;
    icon: keyof typeof Icons;
    color: string;
    bgColor: string;
  }
> = {
  manual: {
    label: "Manual",
    description: "Manually created transaction",
    icon: "Edit",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  bank_sync: {
    label: "Bank Sync",
    description: "Synced from bank connection",
    icon: "Accounts",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  import: {
    label: "Import",
    description: "Imported from CSV file",
    icon: "Import",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
};

function deriveSource(manual: boolean, hasAccount: boolean): TransactionSourceType {
  if (manual) return "manual";
  if (hasAccount) return "bank_sync";
  return "import";
}

export function TransactionSource({ manual, hasAccount, accountName, className }: Props) {
  const source = deriveSource(manual, hasAccount);
  const config = sourceConfig[source];
  const Icon = Icons[config.icon];

  const label = source === "bank_sync" && accountName ? accountName : config.label;
  const description =
    source === "bank_sync" && accountName
      ? `Synced from ${accountName}`
      : config.description;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
              config.bgColor,
              config.color,
              className,
            )}
          >
            <Icon size={12} />
            <span className="truncate max-w-[120px]">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="px-3 py-1.5 text-xs"
          side="top"
          sideOffset={5}
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
