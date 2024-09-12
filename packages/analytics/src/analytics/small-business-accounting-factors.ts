import { PlaidAccountTransaction } from "client-typescript-sdk";

interface AccountingFactors {
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  debtToEquityRatio: number;
  inventoryTurnover: number;
  daysInventoryOutstanding: number;
  receivablesTurnover: number;
  daysSalesOutstanding: number;
  payablesTurnover: number;
  daysPayablesOutstanding: number;
  cashConversionCycle: number;
  grossProfitMargin: number;
  operatingProfitMargin: number;
  netProfitMargin: number;
  returnOnAssets: number;
  returnOnEquity: number;
  assetTurnover: number;
  cashFlowToDebtRatio: number;
}

class SmallBusinessAccountingFactors {
  private transactions: PlaidAccountTransaction[];
  private cachedResults: Map<string, Partial<AccountingFactors>> = new Map();

  // Category mappings
  private static readonly CURRENT_ASSET_CATEGORIES = [
    "TRANSFER_IN_CASH_ADVANCES_AND_LOANS",
    "TRANSFER_IN_DEPOSIT",
    "TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS",
    "TRANSFER_IN_SAVINGS",
    "TRANSFER_IN_ACCOUNT_TRANSFER",
    "TRANSFER_IN_OTHER_TRANSFER_IN",
  ];

  private static readonly CURRENT_LIABILITY_CATEGORIES = [
    "LOAN_PAYMENTS_CAR_PAYMENT",
    "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
    "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT",
    "LOAN_PAYMENTS_OTHER_PAYMENT",
  ];

  private static readonly INVENTORY_CATEGORIES = [
    "GENERAL_MERCHANDISE_DISCOUNT_STORES",
    "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES",
    "GENERAL_MERCHANDISE_SUPERSTORES",
  ];

  private static readonly REVENUE_CATEGORIES = [
    "INCOME_DIVIDENDS",
    "INCOME_INTEREST_EARNED",
    "INCOME_RETIREMENT_PENSION",
    "INCOME_TAX_REFUND",
    "INCOME_UNEMPLOYMENT",
    "INCOME_WAGES",
    "INCOME_OTHER_INCOME",
  ];

  private static readonly EXPENSE_CATEGORIES = [
    "BANK_FEES_ATM_FEES",
    "BANK_FEES_FOREIGN_TRANSACTION_FEES",
    "BANK_FEES_INSUFFICIENT_FUNDS",
    "BANK_FEES_INTEREST_CHARGE",
    "BANK_FEES_OVERDRAFT_FEES",
    "BANK_FEES_OTHER_BANK_FEES",
    "FOOD_AND_DRINK_GROCERIES",
    "GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING",
    "GENERAL_SERVICES_AUTOMOTIVE",
    "GENERAL_SERVICES_CONSULTING_AND_LEGAL",
    "GENERAL_SERVICES_INSURANCE",
    "GENERAL_SERVICES_POSTAGE_AND_SHIPPING",
    "GENERAL_SERVICES_STORAGE",
    "GENERAL_SERVICES_OTHER_GENERAL_SERVICES",
    "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",
    "RENT_AND_UTILITIES_INTERNET_AND_CABLE",
    "RENT_AND_UTILITIES_RENT",
    "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT",
    "RENT_AND_UTILITIES_TELEPHONE",
    "RENT_AND_UTILITIES_WATER",
    "RENT_AND_UTILITIES_OTHER_UTILITIES",
  ];

  constructor(transactions: PlaidAccountTransaction[]) {
    this.transactions = transactions;
  }

  public computeFactors(startDate?: Date, endDate?: Date): AccountingFactors {
    const cacheKey = this.getCacheKey(startDate, endDate);
    if (!this.cachedResults.has(cacheKey)) {
      const factors = this.calculateFactors(startDate, endDate);
      this.cachedResults.set(cacheKey, factors);
    }
    return this.cachedResults.get(cacheKey) as AccountingFactors;
  }

  private getCacheKey(startDate?: Date, endDate?: Date): string {
    return `${startDate?.toISOString() || "start"}_${endDate?.toISOString() || "end"}`;
  }

  private calculateFactors(
    startDate?: Date,
    endDate?: Date,
  ): AccountingFactors {
    const filteredTransactions = this.getTransactionsInDateRange(
      startDate,
      endDate,
    );
    return {
      currentRatio: this.getCurrentRatio(filteredTransactions),
      quickRatio: this.getQuickRatio(filteredTransactions),
      cashRatio: this.getCashRatio(filteredTransactions),
      debtToEquityRatio: this.getDebtToEquityRatio(filteredTransactions),
      inventoryTurnover: this.getInventoryTurnover(filteredTransactions),
      daysInventoryOutstanding:
        this.getDaysInventoryOutstanding(filteredTransactions),
      receivablesTurnover: this.getReceivablesTurnover(filteredTransactions),
      daysSalesOutstanding: this.getDaysSalesOutstanding(filteredTransactions),
      payablesTurnover: this.getPayablesTurnover(filteredTransactions),
      daysPayablesOutstanding:
        this.getDaysPayablesOutstanding(filteredTransactions),
      cashConversionCycle: this.getCashConversionCycle(filteredTransactions),
      grossProfitMargin: this.getGrossProfitMargin(filteredTransactions),
      operatingProfitMargin:
        this.getOperatingProfitMargin(filteredTransactions),
      netProfitMargin: this.getNetProfitMargin(filteredTransactions),
      returnOnAssets: this.getReturnOnAssets(filteredTransactions),
      returnOnEquity: this.getReturnOnEquity(filteredTransactions),
      assetTurnover: this.getAssetTurnover(filteredTransactions),
      cashFlowToDebtRatio: this.getCashFlowToDebtRatio(filteredTransactions),
    };
  }

  private getTransactionsInDateRange(
    startDate?: Date,
    endDate?: Date,
  ): PlaidAccountTransaction[] {
    if (!startDate && !endDate) return this.transactions;
    return this.transactions.filter((t) => {
      const transactionDate = new Date(t.currentDate!);
      return (
        (!startDate || transactionDate >= startDate) &&
        (!endDate || transactionDate <= endDate)
      );
    });
  }

  private sumTransactions(
    transactions: PlaidAccountTransaction[],
    categories: string[],
  ): number {
    return transactions
      .filter(
        (t) =>
          t.amount !== undefined &&
          categories.includes(t.personalFinanceCategoryDetailed || ""),
      )
      .reduce((sum, t) => sum + Math.abs(t.amount!), 0);
  }

  private getCurrentAssets(transactions: PlaidAccountTransaction[]): number {
    return this.sumTransactions(
      transactions,
      SmallBusinessAccountingFactors.CURRENT_ASSET_CATEGORIES,
    );
  }

  private getCurrentLiabilities(
    transactions: PlaidAccountTransaction[],
  ): number {
    return this.sumTransactions(
      transactions,
      SmallBusinessAccountingFactors.CURRENT_LIABILITY_CATEGORIES,
    );
  }

  private getInventory(transactions: PlaidAccountTransaction[]): number {
    return this.sumTransactions(
      transactions,
      SmallBusinessAccountingFactors.INVENTORY_CATEGORIES,
    );
  }

  private getRevenue(transactions: PlaidAccountTransaction[]): number {
    return this.sumTransactions(
      transactions,
      SmallBusinessAccountingFactors.REVENUE_CATEGORIES,
    );
  }

  private getExpenses(transactions: PlaidAccountTransaction[]): number {
    return this.sumTransactions(
      transactions,
      SmallBusinessAccountingFactors.EXPENSE_CATEGORIES,
    );
  }

  private getCash(transactions: PlaidAccountTransaction[]): number {
    return this.sumTransactions(transactions, [
      "TRANSFER_IN_DEPOSIT",
      "TRANSFER_IN_SAVINGS",
    ]);
  }

  private getCurrentRatio(transactions: PlaidAccountTransaction[]): number {
    const currentAssets = this.getCurrentAssets(transactions);
    const currentLiabilities = this.getCurrentLiabilities(transactions);
    return currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0;
  }

  private getQuickRatio(transactions: PlaidAccountTransaction[]): number {
    const currentAssets = this.getCurrentAssets(transactions);
    const inventory = this.getInventory(transactions);
    const currentLiabilities = this.getCurrentLiabilities(transactions);
    return currentLiabilities !== 0
      ? (currentAssets - inventory) / currentLiabilities
      : 0;
  }

  private getCashRatio(transactions: PlaidAccountTransaction[]): number {
    const cash = this.getCash(transactions);
    const currentLiabilities = this.getCurrentLiabilities(transactions);
    return currentLiabilities !== 0 ? cash / currentLiabilities : 0;
  }

  private getDebtToEquityRatio(
    transactions: PlaidAccountTransaction[],
  ): number {
    const totalLiabilities = this.getCurrentLiabilities(transactions);
    const equity = this.getCurrentAssets(transactions) - totalLiabilities;
    return equity !== 0 ? totalLiabilities / equity : 0;
  }

  private getInventoryTurnover(
    transactions: PlaidAccountTransaction[],
  ): number {
    const costOfGoodsSold = this.getExpenses(transactions); // Simplified
    const averageInventory = this.getInventory(transactions); // Simplified
    return averageInventory !== 0 ? costOfGoodsSold / averageInventory : 0;
  }

  private getDaysInventoryOutstanding(
    transactions: PlaidAccountTransaction[],
  ): number {
    const inventoryTurnover = this.getInventoryTurnover(transactions);
    return inventoryTurnover !== 0 ? 365 / inventoryTurnover : 0;
  }

  private getReceivablesTurnover(
    transactions: PlaidAccountTransaction[],
  ): number {
    const netCreditSales = this.getRevenue(transactions); // Simplified
    const averageAccountsReceivable = this.sumTransactions(transactions, [
      "TRANSFER_IN_OTHER_TRANSFER_IN",
    ]); // Simplified
    return averageAccountsReceivable !== 0
      ? netCreditSales / averageAccountsReceivable
      : 0;
  }

  private getDaysSalesOutstanding(
    transactions: PlaidAccountTransaction[],
  ): number {
    const receivablesTurnover = this.getReceivablesTurnover(transactions);
    return receivablesTurnover !== 0 ? 365 / receivablesTurnover : 0;
  }

  private getPayablesTurnover(transactions: PlaidAccountTransaction[]): number {
    const totalSupplierPurchases = this.getExpenses(transactions); // Simplified
    const averageAccountsPayable = this.getCurrentLiabilities(transactions); // Simplified
    return averageAccountsPayable !== 0
      ? totalSupplierPurchases / averageAccountsPayable
      : 0;
  }

  private getDaysPayablesOutstanding(
    transactions: PlaidAccountTransaction[],
  ): number {
    const payablesTurnover = this.getPayablesTurnover(transactions);
    return payablesTurnover !== 0 ? 365 / payablesTurnover : 0;
  }

  private getCashConversionCycle(
    transactions: PlaidAccountTransaction[],
  ): number {
    return (
      this.getDaysInventoryOutstanding(transactions) +
      this.getDaysSalesOutstanding(transactions) -
      this.getDaysPayablesOutstanding(transactions)
    );
  }

  private getGrossProfitMargin(
    transactions: PlaidAccountTransaction[],
  ): number {
    const revenue = this.getRevenue(transactions);
    const costOfGoodsSold = this.getExpenses(transactions); // Simplified
    return revenue !== 0 ? (revenue - costOfGoodsSold) / revenue : 0;
  }

  private getOperatingProfitMargin(
    transactions: PlaidAccountTransaction[],
  ): number {
    const revenue = this.getRevenue(transactions);
    const operatingIncome = revenue - this.getExpenses(transactions);
    return revenue !== 0 ? operatingIncome / revenue : 0;
  }

  private getNetProfitMargin(transactions: PlaidAccountTransaction[]): number {
    const revenue = this.getRevenue(transactions);
    const netIncome = revenue - this.getExpenses(transactions);
    return revenue !== 0 ? netIncome / revenue : 0;
  }

  private getReturnOnAssets(transactions: PlaidAccountTransaction[]): number {
    const netIncome =
      this.getRevenue(transactions) - this.getExpenses(transactions);
    const totalAssets = this.getCurrentAssets(transactions);
    return totalAssets !== 0 ? netIncome / totalAssets : 0;
  }

  private getReturnOnEquity(transactions: PlaidAccountTransaction[]): number {
    const netIncome =
      this.getRevenue(transactions) - this.getExpenses(transactions);
    const equity =
      this.getCurrentAssets(transactions) -
      this.getCurrentLiabilities(transactions);
    return equity !== 0 ? netIncome / equity : 0;
  }

  private getAssetTurnover(transactions: PlaidAccountTransaction[]): number {
    const revenue = this.getRevenue(transactions);
    const totalAssets = this.getCurrentAssets(transactions);
    return totalAssets !== 0 ? revenue / totalAssets : 0;
  }

  private getCashFlowToDebtRatio(
    transactions: PlaidAccountTransaction[],
  ): number {
    const operatingCashFlow =
      this.getRevenue(transactions) - this.getExpenses(transactions); // Simplified
    const totalDebt = this.getCurrentLiabilities(transactions);
    return totalDebt !== 0 ? operatingCashFlow / totalDebt : 0;
  }

  public compareFactors(
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
  ): Record<
    keyof AccountingFactors,
    { period1: number; period2: number; change: number }
  > {
    const factors1 = this.computeFactors(period1Start, period1End);
    const factors2 = this.computeFactors(period2Start, period2End);

    const comparison: any = {};
    for (const key in factors1) {
      comparison[key] = {
        period1: factors1[key as keyof AccountingFactors],
        period2: factors2[key as keyof AccountingFactors],
        change:
          factors2[key as keyof AccountingFactors] -
          factors1[key as keyof AccountingFactors],
      };
    }

    return comparison;
  }
}

export default SmallBusinessAccountingFactors;
