import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function NetPositionWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getNetPosition.queryOptions({
      currency,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Net Position"
        icon={<Icons.Accounts className="size-4" />}
        descriptionLines={2}
      />
    );
  }

  const netPositionData = data?.result;
  const netPosition = netPositionData?.netPosition ?? 0;
  const cash = netPositionData?.cash ?? 0;
  const creditDebt = netPositionData?.creditDebt ?? 0;

  const handleToolCall = (params: {
    toolName: string;
    toolParams?: Record<string, string>;
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

  const handleViewNetPosition = () => {
    handleToolCall({
      toolName: "getNetPosition",
      text: "Show my net position",
    });
  };

  const getDescription = () => {
    const cashCount = netPositionData?.cashAccountCount ?? 0;
    const creditCount = netPositionData?.creditAccountCount ?? 0;
    const totalAccounts = cashCount + creditCount;

    if (totalAccounts === 0) {
      return "No accounts connected";
    }

    return "Cash minus credit debt";
  };

  return (
    <BaseWidget
      title="Net Position"
      icon={<Icons.Accounts className="size-4" />}
      description={getDescription()}
      onClick={handleViewNetPosition}
      actions="View financial position"
    >
      {netPositionData && (
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-normal">
            <FormatAmount
              currency={netPositionData.currency || "USD"}
              amount={netPosition}
              minimumFractionDigits={0}
              maximumFractionDigits={0}
            />
          </h2>

          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Cash</span>
              <span>
                <FormatAmount
                  currency={netPositionData.currency || "USD"}
                  amount={cash}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Credit Debt</span>
              <span>
                -
                <FormatAmount
                  currency={netPositionData.currency || "USD"}
                  amount={creditDebt}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
            </div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
