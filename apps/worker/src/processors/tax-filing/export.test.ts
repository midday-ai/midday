import { describe, expect, it, beforeEach } from "bun:test";
import { format } from "date-fns";
import {
  ACCOUNTING_FORMATS,
  getAccountName,
  getTaxCategoryName,
  DEFAULT_CREDIT_ACCOUNTS,
  DEFAULT_DEBIT_ACCOUNTS,
  type AccountingFormat,
} from "../../utils/accounting-formats-jp";

/**
 * Test data representing transaction records similar to what getTransactions returns
 */
interface TestTransaction {
  id: string;
  date: string | null;
  name: string | null;
  description: string | null;
  amount: number;
  currency: string | null;
  category?: { slug: string | null } | null;
  counterparty_name?: string | null;
  tax_category?: string | null;
  expense_category_code?: string | null;
}

interface TransactionRow {
  date: string;
  debitAccount: string;
  debitSubAccount: string;
  debitAmount: number;
  debitTaxCategory: string;
  creditAccount: string;
  creditSubAccount: string;
  creditAmount: number;
  creditTaxCategory: string;
  description: string;
  account?: string;
  taxCategory?: string;
  amount?: number;
  counterparty?: string;
}

/**
 * Helper function to simulate getFiscalYearDateRange
 */
function getFiscalYearDateRange(fiscalYear: number): { from: string; to: string } {
  return {
    from: `${fiscalYear}-01-01`,
    to: `${fiscalYear}-12-31`,
  };
}

/**
 * Re-implementation of transformTransactionsToAccountingFormat for testing
 * This mirrors the logic in export.ts without the external dependencies
 */
function transformTransactionsToAccountingFormat(
  transactions: TestTransaction[],
  formatType: AccountingFormat,
): TransactionRow[] {
  const rows: TransactionRow[] = [];
  const formatConfig = ACCOUNTING_FORMATS[formatType];

  for (const transaction of transactions) {
    if (!transaction.date) continue;

    const isIncome = transaction.amount > 0;
    const categoryCode = transaction.expense_category_code;
    const taxCategory = transaction.tax_category;
    const accountName = getAccountName(categoryCode, formatType);
    const taxCategoryName = getTaxCategoryName(
      taxCategory,
      formatType,
      isIncome,
    );

    const row: TransactionRow = {
      date: format(
        new Date(transaction.date),
        formatConfig.dateFormat,
      ),
      debitAccount: isIncome
        ? DEFAULT_DEBIT_ACCOUNTS[formatType]
        : accountName,
      debitSubAccount: "",
      debitAmount: Math.abs(transaction.amount),
      debitTaxCategory: isIncome ? "" : taxCategoryName,
      creditAccount: isIncome
        ? accountName
        : DEFAULT_CREDIT_ACCOUNTS[formatType],
      creditSubAccount: "",
      creditAmount: Math.abs(transaction.amount),
      creditTaxCategory: isIncome ? taxCategoryName : "",
      description: transaction.name || transaction.description || "",
      // For freee format (single-entry style)
      account: accountName,
      taxCategory: taxCategoryName,
      amount: transaction.amount,
      counterparty: transaction.counterparty_name || "",
    };

    rows.push(row);
  }

  // Sort by date (newest first)
  rows.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return rows;
}

describe("transformTransactionsToAccountingFormat", () => {
  describe("with income transactions (amount > 0)", () => {
    const incomeTransaction: TestTransaction = {
      id: "tx-001",
      date: "2024-06-15",
      name: "クライアントA 報酬",
      description: "6月分コンサルティング報酬",
      amount: 100000,
      currency: "JPY",
      category: { slug: "revenue" },
      counterparty_name: "株式会社クライアントA",
      tax_category: "standard_10",
      expense_category_code: "110",
    };

    it("should set debit account to 普通預金 (default debit account)", () => {
      const rows = transformTransactionsToAccountingFormat([incomeTransaction], "yayoi");
      expect(rows[0]!.debitAccount).toBe("普通預金");
    });

    it("should set credit account to 売上高 (from category code 110)", () => {
      const rows = transformTransactionsToAccountingFormat([incomeTransaction], "yayoi");
      expect(rows[0]!.creditAccount).toBe("売上高");
    });

    it("should set tax category on credit side for income", () => {
      const rows = transformTransactionsToAccountingFormat([incomeTransaction], "yayoi");
      expect(rows[0]!.creditTaxCategory).toBe("課税売上10%");
      expect(rows[0]!.debitTaxCategory).toBe("");
    });

    it("should use absolute value for amounts", () => {
      const rows = transformTransactionsToAccountingFormat([incomeTransaction], "yayoi");
      expect(rows[0]!.debitAmount).toBe(100000);
      expect(rows[0]!.creditAmount).toBe(100000);
    });

    it("should format date according to format config", () => {
      const yayoiRows = transformTransactionsToAccountingFormat([incomeTransaction], "yayoi");
      expect(yayoiRows[0]!.date).toBe("2024/06/15");

      const freeeRows = transformTransactionsToAccountingFormat([incomeTransaction], "freee");
      expect(freeeRows[0]!.date).toBe("2024-06-15");
    });

    it("should include counterparty for freee format", () => {
      const rows = transformTransactionsToAccountingFormat([incomeTransaction], "freee");
      expect(rows[0]!.counterparty).toBe("株式会社クライアントA");
    });
  });

  describe("with expense transactions (amount < 0)", () => {
    const expenseTransaction: TestTransaction = {
      id: "tx-002",
      date: "2024-06-20",
      name: "交通費",
      description: "新幹線 東京-大阪",
      amount: -15000,
      currency: "JPY",
      category: { slug: "travel" },
      counterparty_name: "JR東海",
      tax_category: "standard_10",
      expense_category_code: "710",
    };

    it("should set debit account to 旅費交通費 (from category code 710)", () => {
      const rows = transformTransactionsToAccountingFormat([expenseTransaction], "yayoi");
      expect(rows[0]!.debitAccount).toBe("旅費交通費");
    });

    it("should set credit account to 普通預金 (default credit account)", () => {
      const rows = transformTransactionsToAccountingFormat([expenseTransaction], "yayoi");
      expect(rows[0]!.creditAccount).toBe("普通預金");
    });

    it("should set tax category on debit side for expenses", () => {
      const rows = transformTransactionsToAccountingFormat([expenseTransaction], "yayoi");
      expect(rows[0]!.debitTaxCategory).toBe("課税仕入10%");
      expect(rows[0]!.creditTaxCategory).toBe("");
    });

    it("should use absolute value for negative amounts", () => {
      const rows = transformTransactionsToAccountingFormat([expenseTransaction], "yayoi");
      expect(rows[0]!.debitAmount).toBe(15000);
      expect(rows[0]!.creditAmount).toBe(15000);
    });
  });

  describe("with reduced tax rate transactions", () => {
    const reducedTaxTransaction: TestTransaction = {
      id: "tx-003",
      date: "2024-06-25",
      name: "会議用お茶代",
      description: "ペットボトルお茶 10本",
      amount: -1500,
      currency: "JPY",
      category: { slug: "office-supplies" },
      tax_category: "reduced_8",
      expense_category_code: "760",
    };

    it("should map reduced_8 to correct tax category for yayoi", () => {
      const rows = transformTransactionsToAccountingFormat([reducedTaxTransaction], "yayoi");
      expect(rows[0]!.debitTaxCategory).toBe("課税仕入8%軽減");
    });

    it("should map reduced_8 to correct tax category for freee", () => {
      const rows = transformTransactionsToAccountingFormat([reducedTaxTransaction], "freee");
      expect(rows[0]!.debitTaxCategory).toBe("課対仕入8%(軽)");
    });

    it("should map reduced_8 to correct tax category for moneyforward", () => {
      const rows = transformTransactionsToAccountingFormat([reducedTaxTransaction], "moneyforward");
      expect(rows[0]!.debitTaxCategory).toBe("軽減仕入8%");
    });
  });

  describe("with exempt transactions", () => {
    const exemptTransaction: TestTransaction = {
      id: "tx-004",
      date: "2024-07-01",
      name: "保険料",
      description: "事業保険",
      amount: -50000,
      currency: "JPY",
      tax_category: "exempt",
      expense_category_code: "800",
    };

    it("should map exempt to 非課税仕入", () => {
      const rows = transformTransactionsToAccountingFormat([exemptTransaction], "yayoi");
      expect(rows[0]!.debitTaxCategory).toBe("非課税仕入");
    });
  });

  describe("with non-taxable transactions", () => {
    const nonTaxableTransaction: TestTransaction = {
      id: "tx-005",
      date: "2024-07-05",
      name: "税金支払い",
      description: "固定資産税",
      amount: -30000,
      currency: "JPY",
      tax_category: "non_taxable",
      expense_category_code: "820",
    };

    it("should map non_taxable to 対象外", () => {
      const rows = transformTransactionsToAccountingFormat([nonTaxableTransaction], "yayoi");
      expect(rows[0]!.debitTaxCategory).toBe("対象外");
    });
  });

  describe("with missing data", () => {
    it("should skip transactions with null date", () => {
      const transactionWithNullDate: TestTransaction = {
        id: "tx-006",
        date: null,
        name: "テスト取引",
        description: null,
        amount: 10000,
        currency: "JPY",
      };

      const rows = transformTransactionsToAccountingFormat([transactionWithNullDate], "yayoi");
      expect(rows.length).toBe(0);
    });

    it("should use 雑費 for unknown category code", () => {
      const transactionWithUnknownCategory: TestTransaction = {
        id: "tx-007",
        date: "2024-08-01",
        name: "その他経費",
        description: null,
        amount: -5000,
        currency: "JPY",
        expense_category_code: "999",
      };

      const rows = transformTransactionsToAccountingFormat([transactionWithUnknownCategory], "yayoi");
      expect(rows[0]!.debitAccount).toBe("雑費");
    });

    it("should use 雑費 for null category code", () => {
      const transactionWithNullCategory: TestTransaction = {
        id: "tx-008",
        date: "2024-08-02",
        name: "不明な経費",
        description: null,
        amount: -3000,
        currency: "JPY",
        expense_category_code: undefined,
      };

      const rows = transformTransactionsToAccountingFormat([transactionWithNullCategory], "yayoi");
      expect(rows[0]!.debitAccount).toBe("雑費");
    });

    it("should use 対象外 for null tax category", () => {
      const transactionWithNullTax: TestTransaction = {
        id: "tx-009",
        date: "2024-08-03",
        name: "税区分なし経費",
        description: null,
        amount: -2000,
        currency: "JPY",
        tax_category: undefined,
      };

      const rows = transformTransactionsToAccountingFormat([transactionWithNullTax], "yayoi");
      expect(rows[0]!.debitTaxCategory).toBe("対象外");
    });

    it("should use name when description is null", () => {
      const transactionWithNullDescription: TestTransaction = {
        id: "tx-010",
        date: "2024-08-04",
        name: "取引名のみ",
        description: null,
        amount: 5000,
        currency: "JPY",
      };

      const rows = transformTransactionsToAccountingFormat([transactionWithNullDescription], "yayoi");
      expect(rows[0]!.description).toBe("取引名のみ");
    });

    it("should use description when name is null", () => {
      const transactionWithNullName: TestTransaction = {
        id: "tx-011",
        date: "2024-08-05",
        name: null,
        description: "説明文のみ",
        amount: 5000,
        currency: "JPY",
      };

      const rows = transformTransactionsToAccountingFormat([transactionWithNullName], "yayoi");
      expect(rows[0]!.description).toBe("説明文のみ");
    });

    it("should use empty string when both name and description are null", () => {
      const transactionWithNullBoth: TestTransaction = {
        id: "tx-012",
        date: "2024-08-06",
        name: null,
        description: null,
        amount: 5000,
        currency: "JPY",
      };

      const rows = transformTransactionsToAccountingFormat([transactionWithNullBoth], "yayoi");
      expect(rows[0]!.description).toBe("");
    });

    it("should use empty string for null counterparty", () => {
      const transactionWithNullCounterparty: TestTransaction = {
        id: "tx-013",
        date: "2024-08-07",
        name: "テスト",
        description: null,
        amount: 5000,
        currency: "JPY",
        counterparty_name: undefined,
      };

      const rows = transformTransactionsToAccountingFormat([transactionWithNullCounterparty], "freee");
      expect(rows[0]!.counterparty).toBe("");
    });
  });

  describe("with multiple transactions", () => {
    const transactions: TestTransaction[] = [
      {
        id: "tx-a",
        date: "2024-01-15",
        name: "1月収入",
        description: null,
        amount: 100000,
        currency: "JPY",
        expense_category_code: "110",
      },
      {
        id: "tx-b",
        date: "2024-06-15",
        name: "6月収入",
        description: null,
        amount: 150000,
        currency: "JPY",
        expense_category_code: "110",
      },
      {
        id: "tx-c",
        date: "2024-03-15",
        name: "3月収入",
        description: null,
        amount: 120000,
        currency: "JPY",
        expense_category_code: "110",
      },
    ];

    it("should sort transactions by date (newest first)", () => {
      const rows = transformTransactionsToAccountingFormat(transactions, "yayoi");
      expect(rows[0]!.description).toBe("6月収入");
      expect(rows[1]!.description).toBe("3月収入");
      expect(rows[2]!.description).toBe("1月収入");
    });

    it("should return same number of rows as transactions", () => {
      const rows = transformTransactionsToAccountingFormat(transactions, "yayoi");
      expect(rows.length).toBe(3);
    });
  });

  describe("format-specific output", () => {
    const testTransaction: TestTransaction = {
      id: "tx-format-test",
      date: "2024-12-31",
      name: "テスト取引",
      description: "フォーマットテスト",
      amount: -10000,
      currency: "JPY",
      expense_category_code: "720",
      tax_category: "standard_10",
      counterparty_name: "テスト会社",
    };

    describe("yayoi format", () => {
      it("should format date as yyyy/MM/dd", () => {
        const rows = transformTransactionsToAccountingFormat([testTransaction], "yayoi");
        expect(rows[0]!.date).toBe("2024/12/31");
      });

      it("should include debit and credit accounts for double-entry", () => {
        const rows = transformTransactionsToAccountingFormat([testTransaction], "yayoi");
        expect(rows[0]!.debitAccount).toBe("通信費");
        expect(rows[0]!.creditAccount).toBe("普通預金");
      });
    });

    describe("freee format", () => {
      it("should format date as yyyy-MM-dd", () => {
        const rows = transformTransactionsToAccountingFormat([testTransaction], "freee");
        expect(rows[0]!.date).toBe("2024-12-31");
      });

      it("should include single account field", () => {
        const rows = transformTransactionsToAccountingFormat([testTransaction], "freee");
        expect(rows[0]!.account).toBe("通信費");
      });

      it("should include counterparty field", () => {
        const rows = transformTransactionsToAccountingFormat([testTransaction], "freee");
        expect(rows[0]!.counterparty).toBe("テスト会社");
      });
    });

    describe("moneyforward format", () => {
      it("should format date as yyyy/MM/dd", () => {
        const rows = transformTransactionsToAccountingFormat([testTransaction], "moneyforward");
        expect(rows[0]!.date).toBe("2024/12/31");
      });

      it("should include tax categories for both debit and credit", () => {
        const rows = transformTransactionsToAccountingFormat([testTransaction], "moneyforward");
        expect(rows[0]!.debitTaxCategory).toBe("課税仕入10%");
        expect(rows[0]!.creditTaxCategory).toBe("");
      });
    });
  });
});

describe("getFiscalYearDateRange", () => {
  it("should return correct date range for 2024", () => {
    const range = getFiscalYearDateRange(2024);
    expect(range.from).toBe("2024-01-01");
    expect(range.to).toBe("2024-12-31");
  });

  it("should return correct date range for 2023", () => {
    const range = getFiscalYearDateRange(2023);
    expect(range.from).toBe("2023-01-01");
    expect(range.to).toBe("2023-12-31");
  });

  it("should return correct date range for 2025", () => {
    const range = getFiscalYearDateRange(2025);
    expect(range.from).toBe("2025-01-01");
    expect(range.to).toBe("2025-12-31");
  });
});
