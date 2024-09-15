import { PlaidAccountTransaction } from "client-typescript-sdk";

export class FinancialAnalysis {
  private transactions: PlaidAccountTransaction[];

  constructor(transactions: PlaidAccountTransaction[]) {
    this.transactions = transactions;
  }

  /**
   * Calculates the monthly ARR (Annual Recurring Revenue) based on the given transactions.
   * @returns {number} The monthly ARR.
   */
  getMonthlyARR(): number {
    const monthlyIncome = this.getMonthlyIncome();
    return monthlyIncome * 12;
  }

  /**
   * Calculates the yearly ARR (Annual Recurring Revenue) based on the given transactions.
   * @returns {number} The yearly ARR.
   */
  getYearlyARR(): number {
    const monthlyIncome = this.getMonthlyIncome();
    return monthlyIncome * 12;
  }

  /**
   * Calculates the income growth rate between two time periods.
   * @param startDate - The start date of the time period.
   * @param endDate - The end date of the time period.
   * @returns {number} The income growth rate.
   */
  getIncomeGrowthRate(startDate: Date, endDate: Date): number {
    const startIncome = this.getMonthlyIncomeForPeriod(startDate, startDate);
    const endIncome = this.getMonthlyIncomeForPeriod(endDate, endDate);
    return (endIncome - startIncome) / startIncome;
  }

  /**
   * Calculates the ARR breakdown by segment.
   * @returns {Record<string, number>} The ARR breakdown by segment.
   */
  getARRBreakdownBySegment(): Record<string, number> {
    const segmentARR: Record<string, number> = {};

    this.transactions.forEach((transaction) => {
      const segment = transaction.personalFinanceCategoryPrimary || "Other";
      const amount = transaction.amount || 0;
      segmentARR[segment] = (segmentARR[segment] || 0) + amount;
    });

    return Object.fromEntries(
      Object.entries(segmentARR).map(([segment, value]) => [
        segment,
        value * 12,
      ]),
    );
  }

  /**
   * Calculates the ARR breakdown by payment channel.
   * @returns {Record<string, number>} The ARR breakdown by payment channel.
   */
  getARRBreakdownByPaymentChannel(): Record<string, number> {
    const paymentChannelARR: Record<string, number> = {};

    this.transactions.forEach((transaction) => {
      const paymentChannel = transaction.paymentChannel || "Other";
      const amount = transaction.amount || 0;
      paymentChannelARR[paymentChannel] =
        (paymentChannelARR[paymentChannel] || 0) + amount;
    });

    return Object.fromEntries(
      Object.entries(paymentChannelARR).map(([channel, value]) => [
        channel,
        value * 12,
      ]),
    );
  }

  /**
   * Calculates the ARR breakdown by transaction type.
   * @returns {Record<string, number>} The ARR breakdown by transaction type.
   */
  getARRBreakdownByTransactionType(): Record<string, number> {
    const transactionTypeARR: Record<string, number> = {};

    this.transactions.forEach((transaction) => {
      const transactionType = transaction.transactionCode || "Other";
      const amount = transaction.amount || 0;
      transactionTypeARR[transactionType] =
        (transactionTypeARR[transactionType] || 0) + amount;
    });

    return Object.fromEntries(
      Object.entries(transactionTypeARR).map(([type, value]) => [
        type,
        value * 12,
      ]),
    );
  }

  /**
   * Calculates the top revenue-generating transactions.
   * @param limit - The maximum number of transactions to return.
   * @returns {PlaidAccountTransaction[]} The top revenue-generating transactions.
   */
  getTopRevenueTransactions(limit: number): PlaidAccountTransaction[] {
    return this.transactions
      .filter((transaction) => transaction.amount)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, limit);
  }

  /**
   * Calculates the top revenue-generating segments.
   * @param limit - The maximum number of segments to return.
   * @returns {Record<string, number>} The top revenue-generating segments.
   */
  getTopRevenueSegments(limit: number): Record<string, number> {
    const segmentARR = this.getARRBreakdownBySegment();
    return Object.fromEntries(
      Object.entries(segmentARR)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit),
    );
  }

  /**
   * Calculates the top revenue-generating payment channels.
   * @param limit - The maximum number of payment channels to return.
   * @returns {Record<string, number>} The top revenue-generating payment channels.
   */
  getTopRevenuePaymentChannels(limit: number): Record<string, number> {
    const paymentChannelARR = this.getARRBreakdownByPaymentChannel();
    return Object.fromEntries(
      Object.entries(paymentChannelARR)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit),
    );
  }

  /**
   * Calculates the top revenue-generating transaction types.
   * @param limit - The maximum number of transaction types to return.
   * @returns {Record<string, number>} The top revenue-generating transaction types.
   */
  getTopRevenueTransactionTypes(limit: number): Record<string, number> {
    const transactionTypeARR = this.getARRBreakdownByTransactionType();
    return Object.fromEntries(
      Object.entries(transactionTypeARR)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit),
    );
  }

  private getMonthlyIncome(): number {
    let totalIncome = 0;

    this.transactions.forEach((transaction) => {
      if (
        transaction.currentDate &&
        transaction.currentDate.getMonth() === new Date().getMonth() &&
        transaction.currentDate.getFullYear() === new Date().getFullYear()
      ) {
        const amount = transaction.amount || 0;
        totalIncome += amount;
      }
    });

    return totalIncome;
  }

  private getMonthlyIncomeForPeriod(startDate: Date, endDate: Date): number {
    let totalIncome = 0;

    this.transactions.forEach((transaction) => {
      if (
        transaction.currentDate &&
        transaction.currentDate >= startDate &&
        transaction.currentDate <= endDate
      ) {
        const amount = transaction.amount || 0;
        totalIncome += amount;
      }
    });

    return totalIncome;
  }
}
