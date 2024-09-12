"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SmallBusinessAccountingFactors {
    transactions;
    cachedResults = new Map();
    // Category mappings
    static CURRENT_ASSET_CATEGORIES = [
        "TRANSFER_IN_CASH_ADVANCES_AND_LOANS",
        "TRANSFER_IN_DEPOSIT",
        "TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS",
        "TRANSFER_IN_SAVINGS",
        "TRANSFER_IN_ACCOUNT_TRANSFER",
        "TRANSFER_IN_OTHER_TRANSFER_IN",
    ];
    static CURRENT_LIABILITY_CATEGORIES = [
        "LOAN_PAYMENTS_CAR_PAYMENT",
        "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
        "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT",
        "LOAN_PAYMENTS_OTHER_PAYMENT",
    ];
    static INVENTORY_CATEGORIES = [
        "GENERAL_MERCHANDISE_DISCOUNT_STORES",
        "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES",
        "GENERAL_MERCHANDISE_SUPERSTORES",
    ];
    static REVENUE_CATEGORIES = [
        "INCOME_DIVIDENDS",
        "INCOME_INTEREST_EARNED",
        "INCOME_RETIREMENT_PENSION",
        "INCOME_TAX_REFUND",
        "INCOME_UNEMPLOYMENT",
        "INCOME_WAGES",
        "INCOME_OTHER_INCOME",
    ];
    static EXPENSE_CATEGORIES = [
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
    constructor(transactions) {
        this.transactions = transactions;
    }
    computeFactors(startDate, endDate) {
        const cacheKey = this.getCacheKey(startDate, endDate);
        if (!this.cachedResults.has(cacheKey)) {
            const factors = this.calculateFactors(startDate, endDate);
            this.cachedResults.set(cacheKey, factors);
        }
        return this.cachedResults.get(cacheKey);
    }
    getCacheKey(startDate, endDate) {
        return `${startDate?.toISOString() || "start"}_${endDate?.toISOString() || "end"}`;
    }
    calculateFactors(startDate, endDate) {
        const filteredTransactions = this.getTransactionsInDateRange(startDate, endDate);
        return {
            currentRatio: this.getCurrentRatio(filteredTransactions),
            quickRatio: this.getQuickRatio(filteredTransactions),
            cashRatio: this.getCashRatio(filteredTransactions),
            debtToEquityRatio: this.getDebtToEquityRatio(filteredTransactions),
            inventoryTurnover: this.getInventoryTurnover(filteredTransactions),
            daysInventoryOutstanding: this.getDaysInventoryOutstanding(filteredTransactions),
            receivablesTurnover: this.getReceivablesTurnover(filteredTransactions),
            daysSalesOutstanding: this.getDaysSalesOutstanding(filteredTransactions),
            payablesTurnover: this.getPayablesTurnover(filteredTransactions),
            daysPayablesOutstanding: this.getDaysPayablesOutstanding(filteredTransactions),
            cashConversionCycle: this.getCashConversionCycle(filteredTransactions),
            grossProfitMargin: this.getGrossProfitMargin(filteredTransactions),
            operatingProfitMargin: this.getOperatingProfitMargin(filteredTransactions),
            netProfitMargin: this.getNetProfitMargin(filteredTransactions),
            returnOnAssets: this.getReturnOnAssets(filteredTransactions),
            returnOnEquity: this.getReturnOnEquity(filteredTransactions),
            assetTurnover: this.getAssetTurnover(filteredTransactions),
            cashFlowToDebtRatio: this.getCashFlowToDebtRatio(filteredTransactions),
        };
    }
    getTransactionsInDateRange(startDate, endDate) {
        if (!startDate && !endDate)
            return this.transactions;
        return this.transactions.filter((t) => {
            const transactionDate = new Date(t.currentDate);
            return ((!startDate || transactionDate >= startDate) &&
                (!endDate || transactionDate <= endDate));
        });
    }
    sumTransactions(transactions, categories) {
        return transactions
            .filter((t) => t.amount !== undefined &&
            categories.includes(t.personalFinanceCategoryDetailed || ""))
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }
    getCurrentAssets(transactions) {
        return this.sumTransactions(transactions, SmallBusinessAccountingFactors.CURRENT_ASSET_CATEGORIES);
    }
    getCurrentLiabilities(transactions) {
        return this.sumTransactions(transactions, SmallBusinessAccountingFactors.CURRENT_LIABILITY_CATEGORIES);
    }
    getInventory(transactions) {
        return this.sumTransactions(transactions, SmallBusinessAccountingFactors.INVENTORY_CATEGORIES);
    }
    getRevenue(transactions) {
        return this.sumTransactions(transactions, SmallBusinessAccountingFactors.REVENUE_CATEGORIES);
    }
    getExpenses(transactions) {
        return this.sumTransactions(transactions, SmallBusinessAccountingFactors.EXPENSE_CATEGORIES);
    }
    getCash(transactions) {
        return this.sumTransactions(transactions, [
            "TRANSFER_IN_DEPOSIT",
            "TRANSFER_IN_SAVINGS",
        ]);
    }
    getCurrentRatio(transactions) {
        const currentAssets = this.getCurrentAssets(transactions);
        const currentLiabilities = this.getCurrentLiabilities(transactions);
        return currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0;
    }
    getQuickRatio(transactions) {
        const currentAssets = this.getCurrentAssets(transactions);
        const inventory = this.getInventory(transactions);
        const currentLiabilities = this.getCurrentLiabilities(transactions);
        return currentLiabilities !== 0
            ? (currentAssets - inventory) / currentLiabilities
            : 0;
    }
    getCashRatio(transactions) {
        const cash = this.getCash(transactions);
        const currentLiabilities = this.getCurrentLiabilities(transactions);
        return currentLiabilities !== 0 ? cash / currentLiabilities : 0;
    }
    getDebtToEquityRatio(transactions) {
        const totalLiabilities = this.getCurrentLiabilities(transactions);
        const equity = this.getCurrentAssets(transactions) - totalLiabilities;
        return equity !== 0 ? totalLiabilities / equity : 0;
    }
    getInventoryTurnover(transactions) {
        const costOfGoodsSold = this.getExpenses(transactions); // Simplified
        const averageInventory = this.getInventory(transactions); // Simplified
        return averageInventory !== 0 ? costOfGoodsSold / averageInventory : 0;
    }
    getDaysInventoryOutstanding(transactions) {
        const inventoryTurnover = this.getInventoryTurnover(transactions);
        return inventoryTurnover !== 0 ? 365 / inventoryTurnover : 0;
    }
    getReceivablesTurnover(transactions) {
        const netCreditSales = this.getRevenue(transactions); // Simplified
        const averageAccountsReceivable = this.sumTransactions(transactions, [
            "TRANSFER_IN_OTHER_TRANSFER_IN",
        ]); // Simplified
        return averageAccountsReceivable !== 0
            ? netCreditSales / averageAccountsReceivable
            : 0;
    }
    getDaysSalesOutstanding(transactions) {
        const receivablesTurnover = this.getReceivablesTurnover(transactions);
        return receivablesTurnover !== 0 ? 365 / receivablesTurnover : 0;
    }
    getPayablesTurnover(transactions) {
        const totalSupplierPurchases = this.getExpenses(transactions); // Simplified
        const averageAccountsPayable = this.getCurrentLiabilities(transactions); // Simplified
        return averageAccountsPayable !== 0
            ? totalSupplierPurchases / averageAccountsPayable
            : 0;
    }
    getDaysPayablesOutstanding(transactions) {
        const payablesTurnover = this.getPayablesTurnover(transactions);
        return payablesTurnover !== 0 ? 365 / payablesTurnover : 0;
    }
    getCashConversionCycle(transactions) {
        return (this.getDaysInventoryOutstanding(transactions) +
            this.getDaysSalesOutstanding(transactions) -
            this.getDaysPayablesOutstanding(transactions));
    }
    getGrossProfitMargin(transactions) {
        const revenue = this.getRevenue(transactions);
        const costOfGoodsSold = this.getExpenses(transactions); // Simplified
        return revenue !== 0 ? (revenue - costOfGoodsSold) / revenue : 0;
    }
    getOperatingProfitMargin(transactions) {
        const revenue = this.getRevenue(transactions);
        const operatingIncome = revenue - this.getExpenses(transactions);
        return revenue !== 0 ? operatingIncome / revenue : 0;
    }
    getNetProfitMargin(transactions) {
        const revenue = this.getRevenue(transactions);
        const netIncome = revenue - this.getExpenses(transactions);
        return revenue !== 0 ? netIncome / revenue : 0;
    }
    getReturnOnAssets(transactions) {
        const netIncome = this.getRevenue(transactions) - this.getExpenses(transactions);
        const totalAssets = this.getCurrentAssets(transactions);
        return totalAssets !== 0 ? netIncome / totalAssets : 0;
    }
    getReturnOnEquity(transactions) {
        const netIncome = this.getRevenue(transactions) - this.getExpenses(transactions);
        const equity = this.getCurrentAssets(transactions) -
            this.getCurrentLiabilities(transactions);
        return equity !== 0 ? netIncome / equity : 0;
    }
    getAssetTurnover(transactions) {
        const revenue = this.getRevenue(transactions);
        const totalAssets = this.getCurrentAssets(transactions);
        return totalAssets !== 0 ? revenue / totalAssets : 0;
    }
    getCashFlowToDebtRatio(transactions) {
        const operatingCashFlow = this.getRevenue(transactions) - this.getExpenses(transactions); // Simplified
        const totalDebt = this.getCurrentLiabilities(transactions);
        return totalDebt !== 0 ? operatingCashFlow / totalDebt : 0;
    }
    compareFactors(period1Start, period1End, period2Start, period2End) {
        const factors1 = this.computeFactors(period1Start, period1End);
        const factors2 = this.computeFactors(period2Start, period2End);
        const comparison = {};
        for (const key in factors1) {
            comparison[key] = {
                period1: factors1[key],
                period2: factors2[key],
                change: factors2[key] -
                    factors1[key],
            };
        }
        return comparison;
    }
}
exports.default = SmallBusinessAccountingFactors;
