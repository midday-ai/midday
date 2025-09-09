/**
 * Enhanced canvas data system for financial tools
 * Provides type-safe, consistent templates for yield parts pattern
 */

// Status levels for consistent UI rendering
export type StatusLevel = "good" | "warning" | "error" | "info";

// Trend directions for metric cards
export type TrendDirection = "up" | "down" | "stable";

// Value formats for different types of metrics
export type ValueFormat = "currency" | "number" | "percentage" | "duration";

// Core metric card template - represents any financial metric
export interface MetricCard {
  id: string;
  title: string;
  value: number;
  currency: string; // Currency code (USD, EUR) or unit (months, %, items, etc.)
  format: ValueFormat;
  subtitle?: string;
  trend?: {
    value: number;
    direction: TrendDirection;
    description: string;
  };
  status?: {
    level: StatusLevel;
    message: string;
  };
  metadata?: Record<string, any>; // Additional data for tooltips, etc.
}

// Time series data point - for charts and trends
export interface TimeSeriesPoint {
  month: string;
  value: number;
  label?: string; // Display label for the point
  metadata?: Record<string, any>; // Additional data for tooltips
}

// Category data - for pie charts and breakdowns
export interface CategoryData {
  id: string;
  name: string;
  value: number;
  color: string;
  percentage: number;
  metadata?: Record<string, any>;
}

// Chart configuration
export interface ChartConfig {
  type: "area" | "bar" | "line" | "pie" | "donut";
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colorScheme?: string[];
}

// Summary section with insights and recommendations
export interface SummarySection {
  title: string;
  description: string;
  insights: string[];
  recommendations: string[];
  metadata?: Record<string, any>;
}

// Table configuration
export interface TableConfig {
  id: string;
  title: string;
  columns: TableColumn[];
  data: TableRow[];
  metadata?: Record<string, any>;
}

export interface TableColumn {
  key: string;
  label: string;
  type: "text" | "number" | "currency" | "date" | "badge" | "percentage";
  align?: "left" | "right" | "center";
  width?: string;
  format?: {
    currency?: string;
    decimals?: number;
    dateFormat?: string;
    badgeVariant?: "default" | "secondary" | "outline";
  };
}

export interface TableRow {
  id: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

// Dashboard layout configuration
export interface DashboardLayout {
  id: string;
  title: string;
  columns: 2 | 4;
  cards: MetricCard[];
  summary: SummarySection;
  chart?: {
    config: ChartConfig;
    data: TimeSeriesPoint[];
  };
  table?: TableConfig;
}

// Period information
export interface PeriodInfo {
  from: string;
  to: string;
  months: number;
  totalMonths: number;
  currency: string;
  label: string; // Human-readable period label
}

// Main canvas data structure - unified format for all financial tools
export interface CanvasData {
  // Metadata
  id: string;
  type: "dashboard" | "chart" | "table" | "report";
  title: string;
  description?: string;

  // Core metrics
  total: number;
  currency: string;
  average?: number;

  // Dashboard layout
  dashboard: DashboardLayout;

  // Chart data
  breakdown: TimeSeriesPoint[];
  categories?: CategoryData[];

  // Period info
  from: string;
  to: string;
  period?: PeriodInfo;

  // Additional metadata
  metadata?: Record<string, any>;
}

// Template helper functions - enhanced for yield parts pattern

// Generate unique IDs for canvas elements
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Create a metric card with enhanced type safety
export function createMetricCard(
  title: string,
  value: number,
  currency: string,
  options?: {
    id?: string;
    format?: ValueFormat;
    subtitle?: string;
    trend?: {
      value: number;
      direction: TrendDirection;
      description: string;
    };
    status?: {
      level: StatusLevel;
      message: string;
    };
    metadata?: Record<string, any>;
  },
): MetricCard {
  return {
    id: options?.id || generateId(),
    title,
    value,
    currency,
    format: options?.format || "currency",
    subtitle: options?.subtitle,
    trend: options?.trend,
    status: options?.status,
    metadata: options?.metadata,
  };
}

// Create a summary section with enhanced structure
export function createSummary(
  title: string,
  description: string,
  insights?: (string | null)[],
  recommendations?: (string | null)[],
  metadata?: Record<string, any>,
): SummarySection {
  return {
    title,
    description,
    insights: insights?.filter(Boolean) as string[],
    recommendations: recommendations?.filter(Boolean) as string[],
    metadata,
  };
}

// Create a dashboard layout with enhanced configuration
// Create table column
export function createTableColumn(
  key: string,
  label: string,
  type: TableColumn["type"],
  options?: {
    align?: "left" | "right" | "center";
    width?: string;
    format?: TableColumn["format"];
  },
): TableColumn {
  return {
    key,
    label,
    type,
    align: options?.align || "left",
    width: options?.width,
    format: options?.format,
  };
}

// Create table row
export function createTableRow(
  id: string,
  data: Record<string, any>,
  metadata?: Record<string, any>,
): TableRow {
  return {
    id,
    data,
    metadata,
  };
}

// Create table configuration
export function createTableConfig(
  title: string,
  columns: TableColumn[],
  data: TableRow[],
  options?: {
    id?: string;
    metadata?: Record<string, any>;
  },
): TableConfig {
  return {
    id: options?.id || generateId(),
    title,
    columns,
    data,
    metadata: options?.metadata,
  };
}

export function createDashboardLayout(
  title: string,
  cards: MetricCard[],
  summary: SummarySection,
  options?: {
    id?: string;
    columns?: 2 | 4;
    chart?: {
      config: ChartConfig;
      data: TimeSeriesPoint[];
    };
    table?: TableConfig;
  },
): DashboardLayout {
  return {
    id: options?.id || generateId(),
    title,
    columns: options?.columns || 4,
    cards,
    summary,
    chart: options?.chart,
    table: options?.table,
  };
}

// Create a time series point with enhanced metadata support
export function createTimeSeriesPoint(
  month: string,
  value: number,
  options?: {
    label?: string;
    metadata?: Record<string, any>;
  },
): TimeSeriesPoint {
  return {
    month,
    value,
    label: options?.label,
    metadata: options?.metadata,
  };
}

// Create category data with enhanced structure
export function createCategoryData(
  name: string,
  value: number,
  total: number,
  color: string,
  options?: {
    id?: string;
    metadata?: Record<string, any>;
  },
): CategoryData {
  return {
    id: options?.id || generateId(),
    name,
    value,
    color,
    percentage: (value / total) * 100,
    metadata: options?.metadata,
  };
}

// Create period information
export function createPeriodInfo(
  from: string,
  to: string,
  months: number,
  totalMonths: number,
  currency: string,
  label?: string,
): PeriodInfo {
  return {
    from,
    to,
    months,
    totalMonths,
    currency,
    label: label || `${from} - ${to}`,
  };
}

// Create chart configuration
export function createChartConfig(
  type: ChartConfig["type"],
  options?: Partial<Omit<ChartConfig, "type">>,
): ChartConfig {
  return {
    type,
    title: options?.title,
    height: options?.height || 200,
    showLegend: options?.showLegend ?? true,
    showGrid: options?.showGrid ?? true,
    colorScheme: options?.colorScheme,
  };
}

// Create enhanced canvas data with unified structure
export function createCanvasData(
  type: CanvasData["type"],
  title: string,
  total: number,
  currency: string,
  dashboard: DashboardLayout,
  breakdown: TimeSeriesPoint[],
  from: string,
  to: string,
  options?: {
    id?: string;
    description?: string;
    average?: number;
    categories?: CategoryData[];
    period?: PeriodInfo;
    metadata?: Record<string, any>;
  },
): CanvasData {
  return {
    id: options?.id || generateId(),
    type,
    title,
    description: options?.description,
    total,
    currency,
    average: options?.average,
    dashboard,
    breakdown,
    categories: options?.categories,
    from,
    to,
    period: options?.period,
    metadata: options?.metadata,
  };
}
