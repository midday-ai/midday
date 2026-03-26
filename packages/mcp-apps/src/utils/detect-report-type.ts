export function detectReportType(data: any): string {
  if (data?.combined && data?.forecast && data?.historical) return "forecast";
  if (data?.data?.periods) return "cash_flow";
  if (data?.data?.growthPercentage !== undefined) return "growth_rate";
  if (data?.data?.overallMargin !== undefined) return "profit_margin";
  if (data?.data?.[0]?.date && data?.data?.[0]?.value !== undefined)
    return "burn_rate";
  if (data?.summary && data?.result) return "period";
  return "unknown";
}
