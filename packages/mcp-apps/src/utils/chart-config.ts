export const commonChartConfig = {
  margin: { top: 6, right: 20, left: 0, bottom: 6 },
  fontFamily: "var(--font-serif)",
  fontSize: 10,
  animationDuration: 300,
} as const;

export const createCompactTickFormatter = () => {
  return (value: number): string => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1_000_000) {
      return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
    }
    if (absValue >= 1_000) {
      return `${sign}${(absValue / 1_000).toFixed(0)}k`;
    }
    return value.toString();
  };
};

export const getZeroInclusiveDomain = (): [
  (dataMin: number) => number,
  (dataMax: number) => number,
] => [
  (dataMin: number) => Math.min(0, dataMin),
  (dataMax: number) => Math.max(0, dataMax),
];
