"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Bar,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function ProfitAnalysisWidget() {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, revenueType, currency } = useMetricsFilter();

  const { data } = useQuery({
    ...trpc.reports.profit.queryOptions({
      from,
      to,
      currency,
      revenueType,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleToolCall = (params: {
    toolName: string;
    toolParams?: Record<string, any>;
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

  const periodLabel = getPeriodLabel(period, from, to);
  const revenueTypeLabel = revenueType === "gross" ? "Gross" : "Net";

  const handleViewAnalysis = () => {
    handleToolCall({
      toolName: "getProfitAnalysis",
      toolParams: {
        from,
        to,
        currency,
        revenueType,
        showCanvas: true,
      },
      text: `Show ${revenueTypeLabel.toLowerCase()} profit & loss statement for ${periodLabel}`,
    });
  };

  const formatCurrency = (amount: number) => {
    return formatAmount({
      amount,
      currency: currency || "USD",
      locale: user?.locale,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Prepare data for chart
  const chartData = (data?.result || []).slice(-12).map((item, index) => ({
    month: format(new Date(item.date), "MMM"),
    profit: item.current.value,
    fill:
      index % 2 === 0
        ? "hsl(var(--muted-foreground))"
        : "hsl(var(--foreground))",
  }));

  return (
    <BaseWidget
      title="Profit & Loss"
      icon={<Icons.PieChart className="size-4" />}
      description={
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[#666666]">
            <span className="text-primary">
              {formatCurrency(data?.summary?.currentTotal ?? 0)}
            </span>{" "}
            · {periodLabel} · {revenueTypeLabel}
          </p>
        </div>
      }
      actions="See detailed analysis"
      onClick={handleViewAnalysis}
    >
      {chartData.length > 0 ? (
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <ReferenceLine
                y={0}
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Bar dataKey="profit" maxBarSize={8} isAnimationActive={false}>
                {chartData.map((entry) => (
                  <Cell key={entry.month} fill={entry.fill} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">No data available</div>
      )}
    </BaseWidget>
  );
}
