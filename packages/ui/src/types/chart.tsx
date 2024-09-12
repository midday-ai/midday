import { z } from "zod";

/**
 * Represents a data point for the AreaChart.
 */
export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface BarChartMultiDataPoint {
  date: string;
  [key: string]: number | string;
}

export interface RadialChartDataPoint {
  label: string;
  value: number;
}

export interface ScatterChartDataPoint {
  x: string;
  y: number;
  z?: number;
}

export interface DataItem {
  date: string;
  current: { value: number };
  previous: { value: number };
}

export interface Meta {
  period: "weekly" | "monthly";
}

export interface ChartDatePointWithDifference {
  result: DataItem[];
  meta: Meta;
}
