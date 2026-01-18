import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function RunwayWidget() {
  const t = useI18n();
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getRunway.queryOptions({
      from,
      to,
      currency,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={t("widgets.runway.title")}
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
      title={t("widgets.runway.title")}
      icon={<Icons.Time className="size-4" />}
      description={t("widgets.runway.description")}
      onClick={() => {
        handleToolCall({
          toolName: "getRunway",
          toolParams: {
            from,
            to,
            currency,
            showCanvas: true,
          },
          text: "Show cash runway",
        });
      }}
      actions={t("widgets.runway.action")}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">{data?.result} {t("widgets.runway.months")}</h2>
      </div>
    </BaseWidget>
  );
}
