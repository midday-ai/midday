/**
 * 日本の会計ソフト向けエクスポートフォーマット定義
 * Phase 12: e-Tax連携
 */

export type AccountingFormat = "yayoi" | "freee" | "moneyforward";

interface ColumnDefinition {
  key: string;
  header: string;
}

interface AccountingFormatConfig {
  name: string;
  extension: string;
  encoding: "shift_jis" | "utf-8";
  columns: ColumnDefinition[];
  dateFormat: string;
}

export const ACCOUNTING_FORMATS: Record<AccountingFormat, AccountingFormatConfig> = {
  yayoi: {
    name: "弥生会計",
    extension: "csv",
    encoding: "shift_jis", // 弥生はShift_JIS必須
    columns: [
      { key: "date", header: "取引日付" },
      { key: "debitAccount", header: "借方勘定科目" },
      { key: "debitSubAccount", header: "借方補助科目" },
      { key: "debitAmount", header: "借方金額" },
      { key: "debitTaxCategory", header: "借方税区分" },
      { key: "creditAccount", header: "貸方勘定科目" },
      { key: "creditSubAccount", header: "貸方補助科目" },
      { key: "creditAmount", header: "貸方金額" },
      { key: "creditTaxCategory", header: "貸方税区分" },
      { key: "description", header: "摘要" },
    ],
    dateFormat: "yyyy/MM/dd",
  },
  freee: {
    name: "freee",
    extension: "csv",
    encoding: "utf-8",
    columns: [
      { key: "date", header: "取引日" },
      { key: "account", header: "勘定科目" },
      { key: "taxCategory", header: "税区分" },
      { key: "amount", header: "金額" },
      { key: "counterparty", header: "取引先" },
      { key: "description", header: "備考" },
    ],
    dateFormat: "yyyy-MM-dd",
  },
  moneyforward: {
    name: "マネーフォワード クラウド会計",
    extension: "csv",
    encoding: "utf-8",
    columns: [
      { key: "date", header: "取引日" },
      { key: "debitAccount", header: "借方勘定科目" },
      { key: "debitTaxCategory", header: "借方税区分" },
      { key: "debitAmount", header: "借方金額" },
      { key: "creditAccount", header: "貸方勘定科目" },
      { key: "creditTaxCategory", header: "貸方税区分" },
      { key: "creditAmount", header: "貸方金額" },
      { key: "description", header: "摘要" },
    ],
    dateFormat: "yyyy/MM/dd",
  },
} as const;

/**
 * 勘定科目コード → 会計ソフト用名称マッピング
 * Middayの勘定科目コード体系（categories-jp.ts）を各会計ソフトの科目名に変換
 */
export const ACCOUNT_NAME_MAPPING: Record<
  string,
  Record<AccountingFormat, string>
> = {
  // 売上
  "110": { yayoi: "売上高", freee: "売上高", moneyforward: "売上高" },
  "111": { yayoi: "売上高", freee: "売上高", moneyforward: "売上高" },
  // 仕入
  "510": { yayoi: "仕入高", freee: "仕入高", moneyforward: "仕入高" },
  // 販売費及び一般管理費
  "610": { yayoi: "役員報酬", freee: "役員報酬", moneyforward: "役員報酬" },
  "620": { yayoi: "給料賃金", freee: "給料賃金", moneyforward: "給料賃金" },
  "630": { yayoi: "外注工賃", freee: "外注費", moneyforward: "外注費" },
  "710": { yayoi: "旅費交通費", freee: "旅費交通費", moneyforward: "旅費交通費" },
  "720": { yayoi: "通信費", freee: "通信費", moneyforward: "通信費" },
  "730": { yayoi: "広告宣伝費", freee: "広告宣伝費", moneyforward: "広告宣伝費" },
  "740": { yayoi: "接待交際費", freee: "接待交際費", moneyforward: "接待交際費" },
  "750": { yayoi: "会議費", freee: "会議費", moneyforward: "会議費" },
  "760": { yayoi: "消耗品費", freee: "消耗品費", moneyforward: "消耗品費" },
  "770": { yayoi: "事務用品費", freee: "消耗品費", moneyforward: "消耗品費" },
  "780": { yayoi: "水道光熱費", freee: "水道光熱費", moneyforward: "水道光熱費" },
  "790": { yayoi: "地代家賃", freee: "地代家賃", moneyforward: "地代家賃" },
  "800": { yayoi: "保険料", freee: "保険料", moneyforward: "保険料" },
  "810": { yayoi: "支払手数料", freee: "支払手数料", moneyforward: "支払手数料" },
  "820": { yayoi: "租税公課", freee: "租税公課", moneyforward: "租税公課" },
  "830": { yayoi: "修繕費", freee: "修繕費", moneyforward: "修繕費" },
  "840": { yayoi: "減価償却費", freee: "減価償却費", moneyforward: "減価償却費" },
  "850": { yayoi: "福利厚生費", freee: "福利厚生費", moneyforward: "福利厚生費" },
  "860": { yayoi: "研修費", freee: "研修採用費", moneyforward: "研修費" },
  "870": { yayoi: "新聞図書費", freee: "新聞図書費", moneyforward: "新聞図書費" },
  "880": { yayoi: "諸会費", freee: "諸会費", moneyforward: "諸会費" },
  "890": { yayoi: "雑費", freee: "雑費", moneyforward: "雑費" },
  // ソフトウェア・クラウドサービス
  "491": { yayoi: "支払手数料", freee: "支払手数料", moneyforward: "支払手数料" },
  // 現金・預金
  "100": { yayoi: "現金", freee: "現金", moneyforward: "現金" },
  "101": { yayoi: "普通預金", freee: "普通預金", moneyforward: "普通預金" },
  "102": { yayoi: "当座預金", freee: "当座預金", moneyforward: "当座預金" },
  // デフォルト（未分類）
  default: { yayoi: "雑費", freee: "雑費", moneyforward: "雑費" },
} as const;

/**
 * 消費税区分マッピング
 * Middayのtax_category → 各会計ソフトの税区分
 */
export const TAX_CATEGORY_MAPPING: Record<
  string,
  Record<AccountingFormat, string>
> = {
  // 売上側
  standard_10_sales: {
    yayoi: "課税売上10%",
    freee: "課税売上10%",
    moneyforward: "課税売上10%",
  },
  reduced_8_sales: {
    yayoi: "課税売上8%軽減",
    freee: "課税売上8%(軽)",
    moneyforward: "軽減売上8%",
  },
  // 仕入側
  standard_10: {
    yayoi: "課税仕入10%",
    freee: "課対仕入10%",
    moneyforward: "課税仕入10%",
  },
  standard_10_purchase: {
    yayoi: "課税仕入10%",
    freee: "課対仕入10%",
    moneyforward: "課税仕入10%",
  },
  reduced_8: {
    yayoi: "課税仕入8%軽減",
    freee: "課対仕入8%(軽)",
    moneyforward: "軽減仕入8%",
  },
  reduced_8_purchase: {
    yayoi: "課税仕入8%軽減",
    freee: "課対仕入8%(軽)",
    moneyforward: "軽減仕入8%",
  },
  exempt: {
    yayoi: "非課税仕入",
    freee: "非課税仕入",
    moneyforward: "非課税仕入",
  },
  non_taxable: {
    yayoi: "対象外",
    freee: "対象外",
    moneyforward: "対象外",
  },
} as const;

/**
 * デフォルト貸方勘定科目（収入取引用）
 */
export const DEFAULT_CREDIT_ACCOUNTS: Record<AccountingFormat, string> = {
  yayoi: "普通預金",
  freee: "普通預金",
  moneyforward: "普通預金",
};

/**
 * デフォルト借方勘定科目（経費取引用）
 */
export const DEFAULT_DEBIT_ACCOUNTS: Record<AccountingFormat, string> = {
  yayoi: "普通預金",
  freee: "普通預金",
  moneyforward: "普通預金",
};

// Fallback account names when no mapping is found
const DEFAULT_ACCOUNT_FALLBACK: Record<AccountingFormat, string> = {
  yayoi: "雑費",
  freee: "雑費",
  moneyforward: "雑費",
};

// Fallback tax category when no mapping is found
const DEFAULT_TAX_CATEGORY_FALLBACK: Record<AccountingFormat, string> = {
  yayoi: "対象外",
  freee: "対象外",
  moneyforward: "対象外",
};

/**
 * 勘定科目コードを会計ソフト用の科目名に変換
 */
export function getAccountName(
  categoryCode: string | null | undefined,
  format: AccountingFormat,
): string {
  if (!categoryCode) {
    return DEFAULT_ACCOUNT_FALLBACK[format];
  }
  return (
    ACCOUNT_NAME_MAPPING[categoryCode]?.[format] ??
    DEFAULT_ACCOUNT_FALLBACK[format]
  );
}

/**
 * 消費税区分を会計ソフト用の区分名に変換
 */
export function getTaxCategoryName(
  taxCategory: string | null | undefined,
  format: AccountingFormat,
  isIncome: boolean,
): string {
  if (!taxCategory) {
    return DEFAULT_TAX_CATEGORY_FALLBACK[format];
  }

  // 売上/仕入を区別
  const category = isIncome ? `${taxCategory}_sales` : taxCategory;

  return (
    TAX_CATEGORY_MAPPING[category]?.[format] ??
    TAX_CATEGORY_MAPPING[taxCategory]?.[format] ??
    DEFAULT_TAX_CATEGORY_FALLBACK[format]
  );
}
