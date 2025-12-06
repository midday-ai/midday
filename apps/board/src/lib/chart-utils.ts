// Compact tick formatter for charts (600k, 1.2M, etc.)
export const createCompactTickFormatter = () => {
  return (value: number): string => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1000000) {
      return `${sign}${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}${(absValue / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };
};

// Utility hook for calculating chart margins based on tick text length
export const useChartMargin = (
  data: any[],
  dataKey: string,
  tickFormatter: (value: number) => string,
) => {
  // Calculate both min and max values from the data
  const values = data.map((d) => d[dataKey]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // For margin calculation, use the maximum absolute value to determine tick range
  // This prevents excessive margin when range spans both negative and positive values
  const maxAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue));

  // Generate realistic tick values that Recharts would actually use
  // Use the max absolute value to determine the longest tick (which will be at the extremes)
  const tickValues = [maxAbsValue];
  if (minValue < 0) {
    tickValues.push(-maxAbsValue);
  }

  // Format all ticks and find the longest one
  const formattedTicks = tickValues.map(tickFormatter);
  const longestTick = formattedTicks.reduce((a, b) =>
    a.length > b.length ? a : b,
  );

  // Calculate dynamic margin based on actual longest tick
  // Adjusted to match target values: 100k=28, 10k=35
  // The negative sign is already included in longestTick.length, so no extra margin needed
  const marginLeft = 48 - longestTick.length * 5;

  return {
    marginLeft,
  };
};
