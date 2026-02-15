import { describe, expect, it } from "bun:test";
import {
  type AccountType,
  CASH_ACCOUNT_TYPES,
  CREDIT_ACCOUNT_TYPE,
  DEBT_ACCOUNT_TYPES,
  getType,
  LOAN_ACCOUNT_TYPE,
} from "./account";

describe("getType function", () => {
  it("should return 'depository' for 'depository' input", () => {
    expect(getType("depository")).toBe("depository");
  });

  it("should return 'credit' for 'credit' input", () => {
    expect(getType("credit")).toBe("credit");
  });

  it("should return 'loan' for 'loan' input", () => {
    expect(getType("loan")).toBe("loan");
  });

  it("should return 'other_asset' for unknown types", () => {
    expect(getType("investment")).toBe("other_asset");
    expect(getType("brokerage")).toBe("other_asset");
    expect(getType("unknown")).toBe("other_asset");
    expect(getType("")).toBe("other_asset");
  });

  it("should return AccountType", () => {
    const result: AccountType = getType("depository");
    expect(result).toBe("depository");
  });
});

describe("Account type constants", () => {
  describe("CASH_ACCOUNT_TYPES", () => {
    it("should include depository and other_asset", () => {
      expect(CASH_ACCOUNT_TYPES).toContain("depository");
      expect(CASH_ACCOUNT_TYPES).toContain("other_asset");
    });

    it("should NOT include credit or loan", () => {
      expect(CASH_ACCOUNT_TYPES).not.toContain("credit");
      expect(CASH_ACCOUNT_TYPES).not.toContain("loan");
    });

    it("should have exactly 2 types", () => {
      expect(CASH_ACCOUNT_TYPES).toHaveLength(2);
    });
  });

  describe("DEBT_ACCOUNT_TYPES", () => {
    it("should include credit and loan", () => {
      expect(DEBT_ACCOUNT_TYPES).toContain("credit");
      expect(DEBT_ACCOUNT_TYPES).toContain("loan");
    });

    it("should NOT include depository or other_asset", () => {
      expect(DEBT_ACCOUNT_TYPES).not.toContain("depository");
      expect(DEBT_ACCOUNT_TYPES).not.toContain("other_asset");
    });

    it("should have exactly 2 types", () => {
      expect(DEBT_ACCOUNT_TYPES).toHaveLength(2);
    });
  });

  describe("Individual type constants", () => {
    it("CREDIT_ACCOUNT_TYPE should be 'credit'", () => {
      expect(CREDIT_ACCOUNT_TYPE).toBe("credit");
    });

    it("LOAN_ACCOUNT_TYPE should be 'loan'", () => {
      expect(LOAN_ACCOUNT_TYPE).toBe("loan");
    });
  });
});

describe("Account type classification scenarios", () => {
  it("Plaid account types should map correctly", () => {
    // Plaid returns these types
    expect(getType("depository")).toBe("depository"); // checking, savings
    expect(getType("credit")).toBe("credit"); // credit cards
    expect(getType("loan")).toBe("loan"); // student loans, etc.
    expect(getType("investment")).toBe("other_asset"); // brokerage
  });

  it("cash accounts should be identifiable", () => {
    const isCashAccount = (type: string) =>
      CASH_ACCOUNT_TYPES.includes(type as (typeof CASH_ACCOUNT_TYPES)[number]);

    expect(isCashAccount("depository")).toBe(true);
    expect(isCashAccount("other_asset")).toBe(true);
    expect(isCashAccount("credit")).toBe(false);
    expect(isCashAccount("loan")).toBe(false);
  });

  it("debt accounts should be identifiable", () => {
    const isDebtAccount = (type: string) =>
      DEBT_ACCOUNT_TYPES.includes(type as (typeof DEBT_ACCOUNT_TYPES)[number]);

    expect(isDebtAccount("credit")).toBe(true);
    expect(isDebtAccount("loan")).toBe(true);
    expect(isDebtAccount("depository")).toBe(false);
    expect(isDebtAccount("other_asset")).toBe(false);
  });
});
