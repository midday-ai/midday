import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function RunwayWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getRunway.queryOptions({
      currency,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Cash Runway"
        icon={<Icons.Time className="size-4" />}
      />
    );
  }

  const handleToolCall = (params: {
    toolName: string;
    toolParams: Record<string, any>;
    text: string;
  }) => {
    if (!chatId) return;

    setChatId(chatId);

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: params.text }],
      metadata: {
        toolCall: {
          toolName: params.toolName,
          toolParams: params.toolParams,
        },
      },
    });
  };

  return (
    <BaseWidget
      title="Cash Runway"
      icon={<Icons.Time className="size-4" />}
      description="Based on last 6 months"
      onClick={() => {
        handleToolCall({
          toolName: "getRunway",
          toolParams: {
            currency,
            showCanvas: true,
          },
          text: "Show cash runway",
        });
      }}
      actions="View runway"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">{data?.result} months</h2>
      </div>
    </BaseWidget>
  );
}
