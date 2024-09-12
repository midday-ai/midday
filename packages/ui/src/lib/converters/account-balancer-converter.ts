import { ChartDataPoint } from "../../types/chart";
import {
  AccountBalanceHistory,
  CategoryMonthlyExpenditure,
} from "client-typescript-sdk";

/**
 * Utility class for converting AccountBalanceHistory objects to ChartDataPoint objects.
 */
export class AccountBalanceConverter {
  /**
   * Converts an array of AccountBalanceHistory objects to an array of ChartDataPoint objects.
   *
   * This method transforms the complex AccountBalanceHistory structure into a simpler
   * ChartDataPoint structure, which is more suitable for charting and data visualization.
   *
   * @param balanceHistory - An array of AccountBalanceHistory objects to convert.
   * @returns An array of ChartDataPoint objects, each containing a date and a balance value.
   * @throws Error if any AccountBalanceHistory object is missing required fields (time or balance).
   *
   * @example
   * const history = [
   *   { time: new Date('2023-01-01'), balance: 1000 },
   *   { time: new Date('2023-01-02'), balance: 1500 }
   * ];
   * const chartData = AccountBalanceConverter.convertToChartDataPoints(history);
   * // Result: [
   * //   { date: '2023-01-01', value: 1000 },
   * //   { date: '2023-01-02', value: 1500 }
   * // ]
   */
  public static convertToChartDataPoints(
    balanceHistory: AccountBalanceHistory[],
  ): ChartDataPoint[] {
    return balanceHistory.map((history) => {
      if (!history.time || history.balance === undefined) {
        throw new Error(
          "AccountBalanceHistory object is missing required fields: time or balance",
        );
      }

      return {
        date: this.formatDate(history.time),
        value: history.balance,
      };
    });
  }

  /**
   * Formats a Date object to a string in 'YYYY-MM-DD' format.
   *
   * This private method is used internally to ensure consistent date formatting
   * for the ChartDataPoint objects.
   *
   * @param date - The Date object to format.
   * @returns A string representation of the date in 'YYYY-MM-DD' format.
   *
   * @example
   * const formattedDate = AccountBalanceConverter['formatDate'](new Date('2023-01-15T12:00:00Z'));
   * // Result: '2023-01-15'
   */
  private static formatDate(date: Date): string {
    return date.toISOString().split("T")[0] || "";
  }
}
