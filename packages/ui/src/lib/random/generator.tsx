import { ChartDataPoint, ScatterChartDataPoint } from "../../types/chart";

import { generateRandomDate } from "../date-utils";

/**
 * Configuration options for generating Payload arrays.
 */
interface PayloadGeneratorOptions {
  count: number;
  minValue?: number;
  maxValue?: number;
  namePrefix?: string;
  colors?: string[];
  chartTypes?: string[];
}

/**
 * Generates an array of Payload objects with random numerical values.
 *
 * @param options - Configuration options for the generator
 * @returns An array of Payload objects
 * @example
 *   const payloads = generatePayloadArray({ count: 5, minValue: 100, maxValue: 500 });
 */
export function generatePayloadArray(
  options: PayloadGeneratorOptions,
): Array<ChartDataPoint> {
  const { count, minValue = 0, maxValue = 1000 } = options;

  return Array.from({ length: count }, (_, index): ChartDataPoint => {
    const randomValue =
      Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    const randomDate = generateRandomDate({
      start: new Date(2020, 0, 1),
      end: new Date(2023, 11, 31),
      inclusiveEnd: true,
    });

    return {
      value: randomValue,
      date: randomDate.toISOString(),
    };
  });
}

export function generateScatterChartData(options: PayloadGeneratorOptions): ScatterChartDataPoint[] {
  const { count = 5, minValue = 0, maxValue = 1000 } = options;

  return Array.from({ length: count }, (): ScatterChartDataPoint => {
    const x = Math.floor(Math.random() * (maxValue - minValue)) + minValue;
    const y = Math.floor(Math.random() * (maxValue - minValue)) + minValue;

    return { x: x.toString(), y: y };
  });
}