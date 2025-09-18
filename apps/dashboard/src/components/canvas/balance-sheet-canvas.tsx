"use client";

import {
  BaseCanvas,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { useEffect, useState } from "react";

export function BalanceSheetCanvas() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const balanceSheetItems = [
    {
      id: "total-assets",
      title: "Total Assets",
      value: "$2,450,000",
      subtitle: "Current + Fixed Assets",
      trend: { value: "+12.5% vs last quarter", isPositive: true },
    },
    {
      id: "total-liabilities",
      title: "Total Liabilities",
      value: "$1,200,000",
      subtitle: "Debts and obligations",
      trend: { value: "+8.2% vs last quarter", isPositive: false },
    },
    {
      id: "equity",
      title: "Shareholder Equity",
      value: "$1,250,000",
      subtitle: "Assets - Liabilities",
      trend: { value: "+15.3% vs last quarter", isPositive: true },
    },
    {
      id: "debt-ratio",
      title: "Debt-to-Equity Ratio",
      value: "0.96",
      subtitle: "Healthy range: 0.5-1.0",
      trend: { value: "Within target range", isPositive: true },
    },
  ];

  return (
    <BaseCanvas>
      <div className="space-y-4">
        <CanvasHeader
          title="Balance Sheet"
          description="Assets, liabilities, and equity overview"
          isLoading={isLoading}
        />

        <CanvasGrid
          items={balanceSheetItems}
          layout="2/2"
          isLoading={isLoading}
        />

        <CanvasSection title="Summary" isLoading={isLoading}>
          <p>
            The company maintains a healthy balance sheet with strong asset
            growth of 12.5% and controlled liability expansion. The
            debt-to-equity ratio of 0.96 indicates a balanced capital structure
            within the recommended range.
          </p>
        </CanvasSection>
      </div>
    </BaseCanvas>
  );
}
