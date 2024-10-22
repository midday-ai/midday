import { getBackendClient } from "@/utils/backend";
import {
  CategoryMonthlyExpenditure,
  CategoryMonthlyIncome,
  GetIncomeMetricsProfileTypeEnum,
  IncomeMetrics,
  MonthlyExpenditure,
  MonthlyIncome,
} from "@solomon-ai/client-typescript-sdk";
import { Suspense } from "react";
import { IncomeMetricsSkeleton } from "./income-metrics.skeleton";
import { IncomeMetricsView } from "./income-metrics.view";

/**
 * Interface representing the properties for the IncomeMetricsServer component.
 * @interface IncomeMetricsServerProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
interface IncomeMetricsServerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional CSS class name for styling */
  className?: string;
  /** Start date for the income metrics query */
  from?: string;
  /** End date for the income metrics query */
  to?: string;
  /** Page number for pagination (defaults to "1") */
  pageNumber?: string;
  /** Number of items per page (defaults to "150") */
  pageSize?: string;
  /** Currency code for income metrics */
  currency: string;
  /** Unique identifier for the user */
  userId: string;
  /** Specific date (as timestamp) to filter incomes */
  date?: number;
  /** Category to filter incomes */
  category?: string;
}

/**
 * Type definition for the income metrics response data
 */
interface IncomeMetricsData {
  incomeMetrics: Array<IncomeMetrics>;
  monthlyIncomeMetrics: Array<MonthlyIncome>;
  incomeMetricsCategories: Array<CategoryMonthlyIncome>;
}

/**
 * Creates a request object for income metrics queries
 * @param baseParams - Common parameters for all requests
 * @param category - Optional category filter
 * @returns Request object for the respective API call
 */
const createMetricsRequest = (
  baseParams: Pick<
    IncomeMetricsServerProps,
    "userId" | "pageNumber" | "pageSize" | "date"
  >,
  category?: string,
) => ({
  userId: baseParams.userId,
  pageNumber: baseParams.pageNumber,
  pageSize: baseParams.pageSize,
  profileType: GetIncomeMetricsProfileTypeEnum.Business,
  month: baseParams.date,
  ...(category && { personalFinanceCategoryPrimary: category }),
});

/**
 * Fetches all income metrics data in parallel
 * @param params - Parameters for the API requests
 * @returns Promise resolving to income metrics data
 */
const fetchIncomeMetrics = async (
  params: IncomeMetricsServerProps,
): Promise<IncomeMetricsData> => {
  const client = getBackendClient();
  const baseParams = {
    userId: params.userId,
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    date: params.date,
  };

  const [
    incomeMetricsResponse,
    monthlyIncomeMetricsResponse,
    incomeMetricsCategoriesResponse,
  ] = await Promise.all([
    client.financialServiceApi.getIncomeMetrics(
      createMetricsRequest(baseParams, params.category),
    ),
    client.financialServiceApi.getMonthlyIncome(
      createMetricsRequest(baseParams),
    ),
    client.financialServiceApi.getUserCategoryMonthlyIncome(
      createMetricsRequest(baseParams, params.category),
    ),
  ]);

  const res = {
    incomeMetrics: incomeMetricsResponse.incomeMetrics ?? [],
    monthlyIncomeMetrics: monthlyIncomeMetricsResponse.monthlyIncomes ?? [],
    incomeMetricsCategories:
      incomeMetricsCategoriesResponse.categoryMonthlyIncome ?? [],
  };

  return res;
};

/**
 * Server component that fetches and displays income metrics data.
 * This component handles multiple API calls in parallel to retrieve various
 * income-related metrics including overall metrics, monthly expenditures,
 * and category-specific expenditures.
 *
 * @async
 * @component
 * @param {IncomeMetricsServerProps} props - Component properties
 * @returns {Promise<JSX.Element>} Rendered component with income metrics
 *
 * @example
 * ```tsx
 * <IncomeMetricsServer
 *   userId="user123"
 *   currency="USD"
 *   date={1634567890000}
 *   category="Food"
 * />
 * ```
 */
const IncomeMetricsServer: React.FC<IncomeMetricsServerProps> = async ({
  className,
  from,
  to,
  currency,
  userId,
  pageNumber = "1",
  pageSize = "150",
  date,
  category,
}) => {
  const { incomeMetrics, monthlyIncomeMetrics, incomeMetricsCategories } =
    await fetchIncomeMetrics({
      className,
      from,
      to,
      currency,
      userId,
      pageNumber,
      pageSize,
      date,
      category,
    });

  return (
    <>
      {/** Income metrics for all expenditures */}
      {/** we pass each element of the income types to a specific sub component */}
      <Suspense fallback={<IncomeMetricsSkeleton />}>
        {/** Income metrics */}
        <IncomeMetricsView
          userId={userId}
          currency={currency}
          incomeMetrics={incomeMetrics}
          monthlyIncomeMetrics={monthlyIncomeMetrics}
          incomeMetricsCategories={incomeMetricsCategories}
        />
      </Suspense>
    </>
  );
};

export { IncomeMetricsServer };
export type { IncomeMetricsData, IncomeMetricsServerProps };
