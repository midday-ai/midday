"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";

type RiskFlag = {
  flag: string;
  severity: "high" | "medium" | "low";
  description: string;
};

type Props = {
  flags: RiskFlag[];
};

const SEVERITY_STYLES: Record<string, string> = {
  high: "text-red-700 bg-red-50",
  medium: "text-amber-700 bg-amber-50",
  low: "text-blue-700 bg-blue-50",
};

const SEVERITY_ICON_STYLES: Record<string, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-blue-600",
};

const SEVERITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function RiskFlags({ flags }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Risk Flags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {flags.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded ${SEVERITY_STYLES[item.severity] ?? "bg-gray-50 text-gray-700"}`}
            >
              <Icons.Error
                className={`size-4 mt-0.5 shrink-0 ${SEVERITY_ICON_STYLES[item.severity] ?? "text-gray-600"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.flag}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {SEVERITY_LABELS[item.severity] ?? item.severity}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs mt-0.5 opacity-80">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
