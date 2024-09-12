"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const financial_analysis_1 = require("./financial-analysis");
describe("FinancialAnalysis", () => {
  let transactions;
  let financialAnalysis;
  beforeEach(() => {
    // Mock transactions data
    transactions = [
      {
        amount: 1000,
        currentDate: new Date(),
        personalFinanceCategoryPrimary: "Income",
        paymentChannel: "ACH",
        transactionCode: "salary",
      },
      {
        amount: 500,
        currentDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        personalFinanceCategoryPrimary: "Income",
        paymentChannel: "Wire",
        transactionCode: "bonus",
      },
      {
        amount: 200,
        currentDate: new Date(),
        personalFinanceCategoryPrimary: "Shopping",
        paymentChannel: "Online",
        transactionCode: "purchase",
      },
    ];
    financialAnalysis = new financial_analysis_1.FinancialAnalysis(
      transactions,
    );
  });
  test("getMonthlyARR should calculate correctly", () => {
    expect(financialAnalysis.getMonthlyARR()).toBe(14400); // (1000 + 200) * 12
  });
  test("getYearlyARR should calculate correctly", () => {
    expect(financialAnalysis.getYearlyARR()).toBe(14400); // (1000 + 200) * 12
  });
  test("getIncomeGrowthRate should calculate correctly", () => {
    const startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = new Date();
    expect(financialAnalysis.getIncomeGrowthRate(startDate, endDate)).toBe(1.4); // (1200 - 500) / 500
  });
  test("getARRBreakdownBySegment should return correct breakdown", () => {
    expect(financialAnalysis.getARRBreakdownBySegment()).toEqual({
      Income: 18000, // (1000 + 500) * 12
      Shopping: 2400, // 200 * 12
    });
  });
  test("getARRBreakdownByPaymentChannel should return correct breakdown", () => {
    expect(financialAnalysis.getARRBreakdownByPaymentChannel()).toEqual({
      ACH: 12000, // 1000 * 12
      Wire: 6000, // 500 * 12
      Online: 2400, // 200 * 12
    });
  });
  test("getARRBreakdownByTransactionType should return correct breakdown", () => {
    expect(financialAnalysis.getARRBreakdownByTransactionType()).toEqual({
      salary: 12000, // 1000 * 12
      bonus: 6000, // 500 * 12
      purchase: 2400, // 200 * 12
    });
  });
  test("getTopRevenueTransactions should return correct transactions", () => {
    expect(financialAnalysis.getTopRevenueTransactions(2)).toEqual([
      transactions[0],
      transactions[1],
    ]);
  });
  test("getTopRevenueSegments should return correct segments", () => {
    expect(financialAnalysis.getTopRevenueSegments(2)).toEqual({
      Income: 18000,
      Shopping: 2400,
    });
  });
  test("getTopRevenuePaymentChannels should return correct channels", () => {
    expect(financialAnalysis.getTopRevenuePaymentChannels(2)).toEqual({
      ACH: 12000,
      Wire: 6000,
    });
  });
  test("getTopRevenueTransactionTypes should return correct types", () => {
    expect(financialAnalysis.getTopRevenueTransactionTypes(2)).toEqual({
      salary: 12000,
      bonus: 6000,
    });
  });
});
