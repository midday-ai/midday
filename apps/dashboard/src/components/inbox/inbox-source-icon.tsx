import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";

type InboxSource = "gmail" | "outlook" | "slack" | "whatsapp" | null;

function getInboxSource(data: {
  inboxAccount?: { provider?: string } | null;
  meta?: unknown;
}): InboxSource {
  // Check inboxAccount provider (for email providers like Gmail, Outlook)
  if (data.inboxAccount?.provider === "gmail") {
    return "gmail";
  }
  if (data.inboxAccount?.provider === "outlook") {
    return "outlook";
  }

  // Check meta.source (for other sources like Slack, WhatsApp)
  if (data.meta && typeof data.meta === "object" && "source" in data.meta) {
    const source = (data.meta as Record<string, unknown>).source;
    if (source === "slack") return "slack";
    if (source === "whatsapp") return "whatsapp";
  }

  return null;
}

type SourceIconConfig = {
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
};

const sourceConfigs: Record<Exclude<InboxSource, null>, SourceIconConfig> = {
  gmail: {
    icon: Icons.Gmail,
    tooltip: "", // Will be set dynamically with email
  },
  outlook: {
    icon: Icons.Outlook,
    tooltip: "", // Will be set dynamically with email
  },
  slack: {
    icon: Icons.Slack,
    tooltip: "Shared via Slack",
  },
  whatsapp: {
    icon: Icons.WhatsApp,
    tooltip: "Shared via WhatsApp",
  },
};

export function InboxSourceIcon({
  data,
}: {
  data: {
    inboxAccount?: { provider?: string; email?: string } | null;
    meta?: unknown;
  };
}) {
  const source = getInboxSource(data);

  if (!source) {
    return null;
  }

  const config = sourceConfigs[source];
  const Icon = config.icon;
  const tooltip =
    (source === "gmail" || source === "outlook") && data.inboxAccount?.email
      ? data.inboxAccount.email
      : config.tooltip;

  return (
    <div className="border-r border-border pr-4">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-default">
              {source === "whatsapp" ? (
                <Icon className="w-3.5 h-3.5 text-[#25D366]" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs px-3 py-1.5">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
