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
    color: "text-[#1F6FEB]",
    bgColor: "bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  },
  bank_sync: {
    label: "Bank Sync",
    description: "Synced from bank connection",
    icon: "Accounts",
    color: "text-[#00C969]",
    bgColor: "bg-[#DDF1E4] dark:bg-[#00C969]/10",
  },
  import: {
    label: "Import",
    description: "Imported from CSV file",
    icon: "Import",
    color: "text-[#F97316]",
    bgColor: "bg-[#FFEDD5] dark:bg-[#F97316]/10",
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
