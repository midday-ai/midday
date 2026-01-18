/**
 * Project ROI Widget (Midday-JP)
 *
 * Displays Return on Investment for projects:
 * - Revenue from invoices
 * - Expenses linked to project
 * - Labor cost (tracked hours × hourly rate)
 * - ROI calculation
 *
 * ROI = (Revenue - Expenses - Labor Cost) / (Expenses + Labor Cost) × 100
 */

import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

interface ProjectROIData {
  projectId: string;
  projectName: string;
  revenue: number;
  expenses: number;
  laborCost: number;
  trackedHours: number;
  roi: number;
}

export function ProjectROIWidget() {
  const t = useI18n();
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getProjectROI.queryOptions({
      currency: currency || "JPY",
      limit: 3,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={t("widgets.project_roi.title")}
        icon={<Icons.Overview className="size-4" />}
        descriptionLines={3}
      />
    );
  }

  const roiData = data?.result;
  const projects = roiData?.projects ?? [];
  const averageROI = roiData?.averageROI ?? 0;

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

  const handleViewProjectROI = () => {
    handleToolCall({
      toolName: "getProjectROI",
      text: "Show project ROI analysis",
    });
  };

  const getROIColor = (roi: number) => {
    if (roi >= 100) return "text-green-500";
    if (roi >= 50) return "text-yellow-500";
    if (roi >= 0) return "text-orange-500";
    return "text-red-500";
  };

  const formatROI = (roi: number) => {
    if (roi >= 0) return `+${roi.toFixed(0)}%`;
    return `${roi.toFixed(0)}%`;
  };

  return (
    <BaseWidget
      title={t("widgets.project_roi.title")}
      icon={<Icons.Overview className="size-4" />}
      description={t("widgets.project_roi.description")}
      onClick={handleViewProjectROI}
      actions={t("widgets.project_roi.action")}
    >
      {roiData && (
        <div className="flex flex-col gap-3">
          {projects.length > 0 ? (
            <>
              <div className="flex flex-col gap-2">
                {projects.slice(0, 3).map((project: ProjectROIData) => (
                  <div
                    key={project.projectId}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-[#666666] truncate max-w-[60%]">
                      {project.projectName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", getROIColor(project.roi))}>
                        {formatROI(project.roi)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {projects.length > 0 && (
                <div className="flex justify-between items-center border-t border-dashed pt-2 mt-1">
                  <span className="text-[#666666] text-sm">{t("widgets.project_roi.average_roi")}</span>
                  <span className={cn("text-lg font-medium", getROIColor(averageROI))}>
                    {formatROI(averageROI)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
              <span className="text-[#666666] text-sm">
                {t("widgets.project_roi.no_projects")}
              </span>
              <span className="text-[#888888] text-xs mt-1">
                {t("widgets.project_roi.create_project")}
              </span>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}
