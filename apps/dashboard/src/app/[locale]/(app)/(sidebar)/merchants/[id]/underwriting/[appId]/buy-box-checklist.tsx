"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";

type BuyBoxResult = {
  name: string;
  passed: boolean;
  actualValue: string | number;
  requiredValue: string | number;
};

type Props = {
  results: BuyBoxResult[];
};

export function BuyBoxChecklist({ results }: Props) {
  const passedCount = results.filter((r) => r.passed).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Buy Box Checklist
          </CardTitle>
          <span className="text-xs text-[#878787]">
            {passedCount}/{results.length} passed
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {results.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-1.5 border-b border-border last:border-0"
            >
              {item.passed ? (
                <Icons.Check className="size-4 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <Icons.Close className="size-4 text-red-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm ${item.passed ? "text-green-800" : "text-red-800"}`}
                >
                  {item.name}
                </span>
                <div className="flex gap-4 text-xs text-[#878787] mt-0.5">
                  <span>Actual: {String(item.actualValue)}</span>
                  <span>Required: {String(item.requiredValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
