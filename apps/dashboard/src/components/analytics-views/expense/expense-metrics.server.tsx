import { getBackendClient } from "@/utils/backend";
import {
  CategoryMonthlyExpenditure,
  ExpenseMetrics,
  GetExpenseMetricsProfileTypeEnum,
  MonthlyExpenditure,
} from "@solomon-ai/client-typescript-sdk";
import { Suspense } from "react";
import { ExpenseMetricsSkeleton } from "./expense-metrics.skeleton";
import { ExpenseMetricsView } from "./expense-metrics.view";

/**
 * Interface representing the properties for the ExpenseMetricsServer component.
 * @interface ExpenseMetricsServerProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
interface ExpenseMetricsServerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional CSS class name for styling */
  className?: string;
  /** Start date for the expense metrics query */
  from?: string;
  /** End date for the expense metrics query */
  to?: string;
  /** Page number for pagination (defaults to "1") */
  pageNumber?: string;
  /** Number of items per page (defaults to "150") */
  pageSize?: string;
  /** Currency code for expense metrics */
  currency: string;
  /** Unique identifier for the user */
  userId: string;
  /** Specific date (as timestamp) to filter expenses */
  date?: number;
  /** Category to filter expenses */
  category?: string;
}

/**
 * Type definition for the expense metrics response data
 */
interface ExpenseMetricsData {
  expenseMetrics: Array<ExpenseMetrics>;
  monthlyExpenseMetrics: Array<MonthlyExpenditure>;
  expenseMetricsCategories: Array<CategoryMonthlyExpenditure>;
}

/**
 * Creates a request object for expense metrics queries
 * @param baseParams - Common parameters for all requests
 * @param category - Optional category filter
 * @returns Request object for the respective API call
 */
const createMetricsRequest = (
  baseParams: Pick<
    ExpenseMetricsServerProps,
    "userId" | "pageNumber" | "pageSize" | "date"
  >,
  category?: string,
) => ({
  userId: baseParams.userId,
  pageNumber: baseParams.pageNumber,
  pageSize: baseParams.pageSize,
  profileType: GetExpenseMetricsProfileTypeEnum.Business,
  month: baseParams.date,
  ...(category && { personalFinanceCategoryPrimary: category }),
});

/**
 * Fetches all expense metrics data in parallel
 * @param params - Parameters for the API requests
 * @returns Promise resolving to expense metrics data
 */
const fetchExpenseMetrics = async (
  params: ExpenseMetricsServerProps,
): Promise<ExpenseMetricsData> => {
  const client = getBackendClient();
  const baseParams = {
    userId: params.userId,
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    date: params.date,
  };

  const [
    expenseMetricsResponse,
    monthlyExpenseMetricsResponse,
    expenseMetricsCategoriesResponse,
  ] = await Promise.all([
    client.financialServiceApi.getExpenseMetrics(
      createMetricsRequest(baseParams, params.category),
    ),
    client.financialServiceApi.getMonthlyExpenditure(
      createMetricsRequest(baseParams),
    ),
    client.financialServiceApi.getUserCategoryMonthlyExpenditure(
      createMetricsRequest(baseParams, params.category),
    ),
  ]);

  const res = {
    expenseMetrics: expenseMetricsResponse.expenseMetrics ?? [],
    monthlyExpenseMetrics:
      monthlyExpenseMetricsResponse.monthlyExpenditures ?? [],
    expenseMetricsCategories:
      expenseMetricsCategoriesResponse.categoryMonthlyExpenditure ?? [],
  };

  return res;
};

/**
 * Server component that fetches and displays expense metrics data.
 * This component handles multiple API calls in parallel to retrieve various
 * expense-related metrics including overall metrics, monthly expenditures,
 * and category-specific expenditures.
 *
 * @async
 * @component
 * @param {ExpenseMetricsServerProps} props - Component properties
 * @returns {Promise<JSX.Element>} Rendered component with expense metrics
 *
 * @example
 * ```tsx
 * <ExpenseMetricsServer
 *   userId="user123"
 *   currency="USD"
 *   date={1634567890000}
 *   category="Food"
 * />
 * ```
 */
const ExpenseMetricsServer: React.FC<ExpenseMetricsServerProps> = async ({
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
  const { expenseMetrics, monthlyExpenseMetrics, expenseMetricsCategories } =
    await fetchExpenseMetrics({
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
      {/** Expense metrics for all expenditures */}
      {/** we pass each element of the expense types to a specific sub component */}
      <Suspense fallback={<ExpenseMetricsSkeleton />}>
        {/** Expense metrics */}
        <ExpenseMetricsView
          userId={userId}
          currency={currency}
          expenseMetrics={expenseMetrics}
          monthlyExpenseMetrics={monthlyExpenseMetrics}
          expenseMetricsCategories={expenseMetricsCategories}
        />
      </Suspense>
    </>
  );
};

export { ExpenseMetricsServer };
export type { ExpenseMetricsData, ExpenseMetricsServerProps };
