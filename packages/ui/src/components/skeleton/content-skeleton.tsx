import React from "react";
import { CardContent, CardHeader } from "../card";
import { AreaChart } from "../charts/base/area-chart";
import { BarChart } from "../charts/base/bar-chart";

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Renders a random statistic card component.
 *
 * @return {ReactElement} The rendered random statistic card component.
 */
export const RandomStatisticCard: React.FC = () => {
  return (
    <div className="flex w-full max-w-sm flex-col items-center justify-center">
      <CardHeader></CardHeader>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid gap-1">
          <div className="text-5xl font-bold tracking-tight">
            {getRandomNumber(1, 100)}%
          </div>
        </div>
      </CardContent>
    </div>
  );
};

/**
 * Renders a content placeholder component based on the specified chart type and enables stats if specified.
 *
 * @param {Object} props - The props object.
 * @param {boolean} props.enableStats - Whether to enable stats or not. Defaults to false.
 * @param {string} props.chartType - The type of chart to render. Can be 'bar', 'line', or 'stats'. Defaults to 'line'.
 * @return {JSX.Element} The rendered content placeholder component.
 */
export const ContentPlaceholder: React.FC<{
  enableStats?: boolean;
  chartType?: "bar" | "line" | "stats";
}> = ({ enableStats, chartType = "line" }) => {
  let component = null;
  switch (chartType) {
    case "bar":
      component = <BarChart currency={""} data={[]} disabled={true} />;
      break;
    case "line":
      component = <AreaChart currency={""} data={[]} disabled={true} />;
      break;
    case "stats":
      component = <RandomStatisticCard />;
      break;
    default:
      component = <AreaChart currency={""} data={[]} disabled={true} />;
      break;
  }

  return (
    <div className="dark:bg-dark-tremor-background-subtle relative h-full overflow-hidden rounded bg-gray-50">
      <svg
        className="absolute inset-0 h-full w-full stroke-gray-200 dark:stroke-gray-700"
        fill="none"
      >
        <defs>
          <pattern
            id="pattern-1"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
          </pattern>
        </defs>
        <rect
          stroke="none"
          fill="url(#pattern-1)"
          width="100%"
          height="100%"
        ></rect>
      </svg>
      {enableStats && component}
    </div>
  );
};
