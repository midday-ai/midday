"use client";

import {
  BaseCanvas,
  CanvasChart,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { useEffect, useState } from "react";
import { BurnRateChart } from "../charts";

export function BurnRateCanvas() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  // Data that matches the image more closely
  const burnRateData = [
    { month: "Oct", amount: 4500, average: 6500 },
    { month: "Nov", amount: 5200, average: 6500 },
    { month: "Dec", amount: 5800, average: 6500 },
    { month: "Jan", amount: 6200, average: 6500 },
    { month: "Feb", amount: 6800, average: 6500 },
    { month: "Mar", amount: 7100, average: 6500 },
    { month: "Apr", amount: 7500, average: 6500 },
  ];

  const burnRateMetrics = [
    {
      id: "current-burn",
      title: "Current Monthly Burn",
      value: "$7,500",
      subtitle: "+5.6% vs last month",
    },
    {
      id: "runway-remaining",
      title: "Runway Remaining",
      value: "10.7 months",
      subtitle: "Below recommended 12+ months",
    },
    {
      id: "average-burn",
      title: "Average Burn Rate",
      value: "$6,500",
      subtitle: "Over last 6 months",
    },
    {
      id: "personnel-costs",
      title: "Personnel Costs",
      value: "65%",
      subtitle: "$4,875 of monthly burn",
    },
  ];

  return (
    <BaseCanvas>
      <CanvasHeader title="Analysis" isLoading={isLoading} />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-8">
          <CanvasChart
            title="Monthly Burn Rate"
            legend={{
              items: [
                { label: "Current", type: "solid", color: "#000000" },
                { label: "Average", type: "pattern", color: "#707070" },
              ],
            }}
            isLoading={isLoading}
            height="20rem"
          >
            <BurnRateChart
              data={burnRateData}
              height={320}
              chartReadyToAnimate={true}
              showLegend={false}
            />
          </CanvasChart>

          <CanvasGrid
            items={burnRateMetrics}
            layout="2/2"
            isLoading={isLoading}
          />

          <CanvasSection title="Summary" isLoading={isLoading}>
            <p>
              Burn rate increased 67% over 6 months ($4,500 to $7,500), driven
              by personnel costs (65% of expenses). Current runway of 10.7
              months is below the recommended 12+ months, requiring cost
              optimization or additional funding.
            </p>
          </CanvasSection>
        </div>
      </div>
    </BaseCanvas>
  );
}
