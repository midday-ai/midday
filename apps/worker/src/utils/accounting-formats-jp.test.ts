import { describe, expect, it } from "bun:test";
import {
  ACCOUNTING_FORMATS,
  ACCOUNT_NAME_MAPPING,
  TAX_CATEGORY_MAPPING,
  DEFAULT_CREDIT_ACCOUNTS,
  DEFAULT_DEBIT_ACCOUNTS,
  getAccountName,
  getTaxCategoryName,
  type AccountingFormat,
} from "./accounting-formats-jp";

describe("ACCOUNTING_FORMATS", () => {
  it("should define three accounting formats", () => {
    const formats = Object.keys(ACCOUNTING_FORMATS);
    expect(formats).toEqual(["yayoi", "freee", "moneyforward"]);
  });

  describe("yayoi format", () => {
    const yayoi = ACCOUNTING_FORMATS.yayoi;

    it("should have correct name", () => {
      expect(yayoi.name).toBe("弥生会計");
    });

    it("should use shift_jis encoding", () => {
      expect(yayoi.encoding).toBe("shift_jis");
    });

    it("should use csv extension", () => {
      expect(yayoi.extension).toBe("csv");
    });

    it("should have 10 columns for double-entry bookkeeping", () => {
      expect(yayoi.columns.length).toBe(10);
    });

    it("should include debit and credit columns", () => {
      const columnKeys = yayoi.columns.map((c) => c.key);
      expect(columnKeys).toContain("debitAccount");
      expect(columnKeys).toContain("creditAccount");
      expect(columnKeys).toContain("debitAmount");
      expect(columnKeys).toContain("creditAmount");
    });

    it("should use yyyy/MM/dd date format", () => {
      expect(yayoi.dateFormat).toBe("yyyy/MM/dd");
    });
  });

  describe("freee format", () => {
    const freee = ACCOUNTING_FORMATS.freee;

    it("should have correct name", () => {
      expect(freee.name).toBe("freee");
    });

    it("should use utf-8 encoding", () => {
      expect(freee.encoding).toBe("utf-8");
    });

    it("should have 6 columns for single-entry style", () => {
      expect(freee.columns.length).toBe(6);
    });

    it("should include single account column", () => {
      const columnKeys = freee.columns.map((c) => c.key);
      expect(columnKeys).toContain("account");
      expect(columnKeys).not.toContain("debitAccount");
    });

    it("should use yyyy-MM-dd date format", () => {
      expect(freee.dateFormat).toBe("yyyy-MM-dd");
    });
  });

  describe("moneyforward format", () => {
    const mf = ACCOUNTING_FORMATS.moneyforward;

    it("should have correct name", () => {
      expect(mf.name).toBe("マネーフォワード クラウド会計");
    });

    it("should use utf-8 encoding", () => {
      expect(mf.encoding).toBe("utf-8");
    });

    it("should have 8 columns for double-entry bookkeeping", () => {
      expect(mf.columns.length).toBe(8);
    });

    it("should use yyyy/MM/dd date format", () => {
      expect(mf.dateFormat).toBe("yyyy/MM/dd");
    });
  });
});

describe("ACCOUNT_NAME_MAPPING", () => {
  it("should map revenue code 110 correctly", () => {
    const mapping = ACCOUNT_NAME_MAPPING["110"];
    expect(mapping).toBeDefined();
    expect(mapping!.yayoi).toBe("売上高");
    expect(mapping!.freee).toBe("売上高");
    expect(mapping!.moneyforward).toBe("売上高");
  });

  it("should map cost of goods sold code 510 correctly", () => {
    const mapping = ACCOUNT_NAME_MAPPING["510"];
    expect(mapping).toBeDefined();
    expect(mapping!.yayoi).toBe("仕入高");
  });

  it("should map travel expenses code 710 correctly", () => {
    const mapping = ACCOUNT_NAME_MAPPING["710"];
    expect(mapping).toBeDefined();
    expect(mapping!.yayoi).toBe("旅費交通費");
    expect(mapping!.freee).toBe("旅費交通費");
    expect(mapping!.moneyforward).toBe("旅費交通費");
  });

  it("should map communication expenses code 720 correctly", () => {
    const mapping = ACCOUNT_NAME_MAPPING["720"];
    expect(mapping).toBeDefined();
    expect(mapping!.yayoi).toBe("通信費");
  });

  it("should map miscellaneous expenses code 890 correctly", () => {
    const mapping = ACCOUNT_NAME_MAPPING["890"];
    expect(mapping).toBeDefined();
    expect(mapping!.yayoi).toBe("雑費");
    expect(mapping!.freee).toBe("雑費");
    expect(mapping!.moneyforward).toBe("雑費");
  });

  it("should have default mapping for unknown codes", () => {
    const mapping = ACCOUNT_NAME_MAPPING["default"];
    expect(mapping).toBeDefined();
    expect(mapping!.yayoi).toBe("雑費");
    expect(mapping!.freee).toBe("雑費");
    expect(mapping!.moneyforward).toBe("雑費");
  });

  it("should map cash/bank account codes", () => {
    expect(ACCOUNT_NAME_MAPPING["100"]?.yayoi).toBe("現金");
    expect(ACCOUNT_NAME_MAPPING["101"]?.yayoi).toBe("普通預金");
    expect(ACCOUNT_NAME_MAPPING["102"]?.yayoi).toBe("当座預金");
  });
});

describe("TAX_CATEGORY_MAPPING", () => {
  describe("sales tax categories", () => {
    it("should map standard_10_sales correctly", () => {
      const mapping = TAX_CATEGORY_MAPPING["standard_10_sales"];
      expect(mapping).toBeDefined();
      expect(mapping!.yayoi).toBe("課税売上10%");
      expect(mapping!.freee).toBe("課税売上10%");
      expect(mapping!.moneyforward).toBe("課税売上10%");
    });

    it("should map reduced_8_sales correctly", () => {
      const mapping = TAX_CATEGORY_MAPPING["reduced_8_sales"];
      expect(mapping).toBeDefined();
      expect(mapping!.yayoi).toBe("課税売上8%軽減");
      expect(mapping!.freee).toBe("課税売上8%(軽)");
      expect(mapping!.moneyforward).toBe("軽減売上8%");
    });
  });

  describe("purchase tax categories", () => {
    it("should map standard_10 correctly", () => {
      const mapping = TAX_CATEGORY_MAPPING["standard_10"];
      expect(mapping).toBeDefined();
      expect(mapping!.yayoi).toBe("課税仕入10%");
      expect(mapping!.freee).toBe("課対仕入10%");
      expect(mapping!.moneyforward).toBe("課税仕入10%");
    });

    it("should map reduced_8 correctly", () => {
      const mapping = TAX_CATEGORY_MAPPING["reduced_8"];
      expect(mapping).toBeDefined();
      expect(mapping!.yayoi).toBe("課税仕入8%軽減");
      expect(mapping!.freee).toBe("課対仕入8%(軽)");
      expect(mapping!.moneyforward).toBe("軽減仕入8%");
    });

    it("should map exempt correctly", () => {
      const mapping = TAX_CATEGORY_MAPPING["exempt"];
      expect(mapping).toBeDefined();
      expect(mapping!.yayoi).toBe("非課税仕入");
      expect(mapping!.freee).toBe("非課税仕入");
      expect(mapping!.moneyforward).toBe("非課税仕入");
    });

    it("should map non_taxable correctly", () => {
      const mapping = TAX_CATEGORY_MAPPING["non_taxable"];
      expect(mapping).toBeDefined();
      expect(mapping!.yayoi).toBe("対象外");
      expect(mapping!.freee).toBe("対象外");
      expect(mapping!.moneyforward).toBe("対象外");
    });
  });
});

describe("DEFAULT_CREDIT_ACCOUNTS", () => {
  it("should have 普通預金 for all formats", () => {
    expect(DEFAULT_CREDIT_ACCOUNTS.yayoi).toBe("普通預金");
    expect(DEFAULT_CREDIT_ACCOUNTS.freee).toBe("普通預金");
    expect(DEFAULT_CREDIT_ACCOUNTS.moneyforward).toBe("普通預金");
  });
});

describe("DEFAULT_DEBIT_ACCOUNTS", () => {
  it("should have 普通預金 for all formats", () => {
    expect(DEFAULT_DEBIT_ACCOUNTS.yayoi).toBe("普通預金");
    expect(DEFAULT_DEBIT_ACCOUNTS.freee).toBe("普通預金");
    expect(DEFAULT_DEBIT_ACCOUNTS.moneyforward).toBe("普通預金");
  });
});

describe("getAccountName", () => {
  const formats: AccountingFormat[] = ["yayoi", "freee", "moneyforward"];

  describe("with known category codes", () => {
    it("should return 売上高 for code 110", () => {
      expect(getAccountName("110", "yayoi")).toBe("売上高");
      expect(getAccountName("110", "freee")).toBe("売上高");
      expect(getAccountName("110", "moneyforward")).toBe("売上高");
    });

    it("should return 旅費交通費 for code 710", () => {
      expect(getAccountName("710", "yayoi")).toBe("旅費交通費");
      expect(getAccountName("710", "freee")).toBe("旅費交通費");
      expect(getAccountName("710", "moneyforward")).toBe("旅費交通費");
    });

    it("should return 通信費 for code 720", () => {
      expect(getAccountName("720", "yayoi")).toBe("通信費");
      expect(getAccountName("720", "freee")).toBe("通信費");
      expect(getAccountName("720", "moneyforward")).toBe("通信費");
    });

    it("should return 広告宣伝費 for code 730", () => {
      expect(getAccountName("730", "yayoi")).toBe("広告宣伝費");
      expect(getAccountName("730", "freee")).toBe("広告宣伝費");
      expect(getAccountName("730", "moneyforward")).toBe("広告宣伝費");
    });

    it("should return correct account for expense codes", () => {
      expect(getAccountName("740", "yayoi")).toBe("接待交際費");
      expect(getAccountName("760", "yayoi")).toBe("消耗品費");
      expect(getAccountName("780", "yayoi")).toBe("水道光熱費");
      expect(getAccountName("790", "yayoi")).toBe("地代家賃");
      expect(getAccountName("810", "yayoi")).toBe("支払手数料");
    });
  });

  describe("with unknown category codes", () => {
    it("should return 雑費 for unknown code", () => {
      expect(getAccountName("999", "yayoi")).toBe("雑費");
      expect(getAccountName("999", "freee")).toBe("雑費");
      expect(getAccountName("999", "moneyforward")).toBe("雑費");
    });

    it("should return 雑費 for random string", () => {
      expect(getAccountName("unknown", "yayoi")).toBe("雑費");
    });
  });

  describe("with null or undefined", () => {
    it("should return 雑費 for null", () => {
      expect(getAccountName(null, "yayoi")).toBe("雑費");
      expect(getAccountName(null, "freee")).toBe("雑費");
      expect(getAccountName(null, "moneyforward")).toBe("雑費");
    });

    it("should return 雑費 for undefined", () => {
      expect(getAccountName(undefined, "yayoi")).toBe("雑費");
      expect(getAccountName(undefined, "freee")).toBe("雑費");
      expect(getAccountName(undefined, "moneyforward")).toBe("雑費");
    });
  });

  describe("with empty string", () => {
    it("should return 雑費 for empty string", () => {
      expect(getAccountName("", "yayoi")).toBe("雑費");
    });
  });
});

describe("getTaxCategoryName", () => {
  describe("with sales (isIncome = true)", () => {
    it("should return 課税売上10% for standard_10 with yayoi", () => {
      expect(getTaxCategoryName("standard_10", "yayoi", true)).toBe("課税売上10%");
    });

    it("should return 課税売上10% for standard_10 with freee", () => {
      expect(getTaxCategoryName("standard_10", "freee", true)).toBe("課税売上10%");
    });

    it("should return 課税売上10% for standard_10 with moneyforward", () => {
      expect(getTaxCategoryName("standard_10", "moneyforward", true)).toBe("課税売上10%");
    });

    it("should return 課税売上8%軽減 for reduced_8 with yayoi", () => {
      expect(getTaxCategoryName("reduced_8", "yayoi", true)).toBe("課税売上8%軽減");
    });

    it("should return 課税売上8%(軽) for reduced_8 with freee", () => {
      expect(getTaxCategoryName("reduced_8", "freee", true)).toBe("課税売上8%(軽)");
    });
  });

  describe("with purchases (isIncome = false)", () => {
    it("should return 課税仕入10% for standard_10 with yayoi", () => {
      expect(getTaxCategoryName("standard_10", "yayoi", false)).toBe("課税仕入10%");
    });

    it("should return 課対仕入10% for standard_10 with freee", () => {
      expect(getTaxCategoryName("standard_10", "freee", false)).toBe("課対仕入10%");
    });

    it("should return 課税仕入10% for standard_10 with moneyforward", () => {
      expect(getTaxCategoryName("standard_10", "moneyforward", false)).toBe("課税仕入10%");
    });

    it("should return 課税仕入8%軽減 for reduced_8 with yayoi", () => {
      expect(getTaxCategoryName("reduced_8", "yayoi", false)).toBe("課税仕入8%軽減");
    });

    it("should return 課対仕入8%(軽) for reduced_8 with freee", () => {
      expect(getTaxCategoryName("reduced_8", "freee", false)).toBe("課対仕入8%(軽)");
    });

    it("should return 非課税仕入 for exempt", () => {
      expect(getTaxCategoryName("exempt", "yayoi", false)).toBe("非課税仕入");
      expect(getTaxCategoryName("exempt", "freee", false)).toBe("非課税仕入");
      expect(getTaxCategoryName("exempt", "moneyforward", false)).toBe("非課税仕入");
    });

    it("should return 対象外 for non_taxable", () => {
      expect(getTaxCategoryName("non_taxable", "yayoi", false)).toBe("対象外");
      expect(getTaxCategoryName("non_taxable", "freee", false)).toBe("対象外");
      expect(getTaxCategoryName("non_taxable", "moneyforward", false)).toBe("対象外");
    });
  });

  describe("with null or undefined", () => {
    it("should return 対象外 for null", () => {
      expect(getTaxCategoryName(null, "yayoi", false)).toBe("対象外");
      expect(getTaxCategoryName(null, "freee", false)).toBe("対象外");
      expect(getTaxCategoryName(null, "moneyforward", false)).toBe("対象外");
    });

    it("should return 対象外 for undefined", () => {
      expect(getTaxCategoryName(undefined, "yayoi", false)).toBe("対象外");
      expect(getTaxCategoryName(undefined, "freee", true)).toBe("対象外");
      expect(getTaxCategoryName(undefined, "moneyforward", true)).toBe("対象外");
    });
  });

  describe("with unknown tax category", () => {
    it("should return 対象外 for unknown category", () => {
      expect(getTaxCategoryName("unknown_category", "yayoi", false)).toBe("対象外");
      expect(getTaxCategoryName("something_else", "freee", true)).toBe("対象外");
    });
  });
});
