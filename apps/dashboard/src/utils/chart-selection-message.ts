import { format, parse, parseISO } from "date-fns";

/**
 * Maps chart type identifiers to natural language names
 */
const chartTypeMap: Record<string, string> = {
  "monthly-revenue": "revenue",
  revenue: "revenue",
  profit: "profit",
  "burn-rate": "burn rate",
  expenses: "expenses",
  "revenue-forecast": "revenue forecast",
  runway: "runway",
  "category-expenses": "category expenses",
  "stacked-bar": "expenses",
  "revenue-trend": "revenue trends",
  "cash-flow": "cash flow",
  "growth-rate": "growth rate",
  "business-health-score": "business health score",
  "invoice-payment": "invoice payments",
  "tax-trend": "tax trends",
  "stress-test": "cash flow stress test",
};

/**
 * Gets a natural language name for a chart type
 */
export function getChartTypeName(chartId: string): string {
  return chartTypeMap[chartId] || chartId;
}

/**
 * Parses a date string (could be ISO string, month name, etc.) and returns a Date object
 */
function parseDate(dateStr: string): Date | null {
  // Try ISO string first (use parseISO for correct timezone handling)
  if (dateStr.includes("T") || dateStr.includes("-")) {
    const parsed = parseISO(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Try month abbreviations (Jan, Feb, etc.)
  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  if (monthMap[dateStr] !== undefined) {
    // Use current year for month-only dates
    const now = new Date();
    return new Date(now.getFullYear(), monthMap[dateStr], 1);
  }

  // Try parsing with date-fns common formats
  const formats = ["MMM", "MMMM", "yyyy-MM-dd", "MM/dd/yyyy"];
  for (const fmt of formats) {
    try {
      const parsed = parse(dateStr, fmt, new Date());
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch {
      // Continue to next format
    }
  }

  return null;
}

/**
 * Formats a date range for natural language display
 */
function formatDateRange(startDate: Date, endDate: Date): string {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Check if both dates are in the same year
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  // If dates are months only (day is 1), format as month names
  if (
    startDate.getDate() === 1 &&
    endDate.getDate() === 1 &&
    startYear === endYear &&
    startYear === currentYear
  ) {
    const startMonth = format(startDate, "MMMM");
    const endMonth = format(endDate, "MMMM");

    if (startMonth === endMonth) {
      return startMonth;
    }

    return `${startMonth} to ${endMonth}`;
  }

  // Format as full dates if different years or specific dates
  const startFormatted = format(startDate, "MMMM d");
  const endFormatted = format(endDate, "MMMM d");

  if (startFormatted === endFormatted) {
    return startFormatted;
  }

  return `${startFormatted} to ${endFormatted}`;
}

/**
 * Generates a natural language message for chart period selection
 */
export function generateChartSelectionMessage(
  startDate: string,
  endDate: string,
  chartType: string,
): string {
  const chartName = getChartTypeName(chartType);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) {
    // Fallback to simple format if parsing fails
    return `Show me a breakdown of ${chartName} from ${startDate} to ${endDate}`;
  }

  const dateRange = formatDateRange(start, end);
  return `Show me a breakdown of ${chartName} from ${dateRange}`;
}
