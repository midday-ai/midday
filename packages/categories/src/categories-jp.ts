/**
 * Japanese Expense Categories (勘定科目) Mapping
 * Midday-JP
 *
 * Standard Japanese account codes (勘定科目コード) mapped to Midday categories.
 * Based on common practice for freelancers and small businesses in Japan.
 *
 * Code ranges:
 * 100-199: 資産 (Assets)
 * 200-299: 負債 (Liabilities)
 * 300-399: 純資産 (Equity)
 * 400-499: 収益 (Revenue)
 * 500-599: 売上原価 (Cost of Goods Sold)
 * 600-699: 人件費 (Personnel Expenses)
 * 700-899: 経費 (Expenses)
 * 900-999: 税金・その他 (Taxes & Others)
 */

import type { ChildCategory, ParentCategory } from "./types";

export interface JapaneseAccountCode {
  /** Japanese account code (勘定科目コード) */
  code: string;
  /** Japanese account name (勘定科目名) */
  nameJa: string;
  /** English account name */
  nameEn: string;
  /** Mapped Midday category slug */
  slug: string;
  /** Parent category slug */
  parentSlug: string;
  /** Is this a deductible expense (必要経費) */
  isDeductible: boolean;
  /** Deduction rate limit if applicable (e.g., 接待交際費) */
  deductionRateLimit?: number;
  /** Notes about this account */
  notes?: string;
}

/**
 * Japanese account codes mapped to Midday categories
 * 日本の勘定科目とMiddayカテゴリのマッピング
 */
export const JAPANESE_ACCOUNT_CODES: JapaneseAccountCode[] = [
  // ===== 収益 (Revenue) - 400番台 =====
  {
    code: "410",
    nameJa: "売上高",
    nameEn: "Sales Revenue",
    slug: "income",
    parentSlug: "revenue",
    isDeductible: false,
  },
  {
    code: "411",
    nameJa: "サービス売上",
    nameEn: "Service Revenue",
    slug: "service-revenue",
    parentSlug: "revenue",
    isDeductible: false,
  },
  {
    code: "412",
    nameJa: "商品売上",
    nameEn: "Product Sales",
    slug: "product-sales",
    parentSlug: "revenue",
    isDeductible: false,
  },
  {
    code: "420",
    nameJa: "受取利息",
    nameEn: "Interest Income",
    slug: "interest-income",
    parentSlug: "revenue",
    isDeductible: false,
  },
  {
    code: "490",
    nameJa: "雑収入",
    nameEn: "Other Income",
    slug: "other-income",
    parentSlug: "revenue",
    isDeductible: false,
  },

  // ===== 売上原価 (Cost of Goods Sold) - 500番台 =====
  {
    code: "510",
    nameJa: "仕入高",
    nameEn: "Cost of Goods Sold",
    slug: "inventory",
    parentSlug: "cost-of-goods-sold",
    isDeductible: true,
  },
  {
    code: "520",
    nameJa: "外注費",
    nameEn: "Outsourcing Costs",
    slug: "contractors",
    parentSlug: "professional-services",
    isDeductible: true,
    notes: "外部への業務委託費用",
  },

  // ===== 人件費 (Personnel Expenses) - 600番台 =====
  {
    code: "610",
    nameJa: "役員報酬",
    nameEn: "Executive Compensation",
    slug: "salary",
    parentSlug: "human-resources",
    isDeductible: true,
    notes: "法人の場合のみ適用",
  },
  {
    code: "620",
    nameJa: "給料賃金",
    nameEn: "Salaries & Wages",
    slug: "salary",
    parentSlug: "human-resources",
    isDeductible: true,
  },
  {
    code: "630",
    nameJa: "賞与",
    nameEn: "Bonuses",
    slug: "salary",
    parentSlug: "human-resources",
    isDeductible: true,
  },
  {
    code: "640",
    nameJa: "法定福利費",
    nameEn: "Statutory Benefits",
    slug: "benefits",
    parentSlug: "human-resources",
    isDeductible: true,
    notes: "社会保険料の会社負担分",
  },
  {
    code: "650",
    nameJa: "福利厚生費",
    nameEn: "Employee Benefits",
    slug: "benefits",
    parentSlug: "human-resources",
    isDeductible: true,
  },
  {
    code: "660",
    nameJa: "研修費",
    nameEn: "Training Expenses",
    slug: "training",
    parentSlug: "human-resources",
    isDeductible: true,
  },

  // ===== 経費 (Operating Expenses) - 700番台 =====
  {
    code: "710",
    nameJa: "旅費交通費",
    nameEn: "Travel & Transportation",
    slug: "travel",
    parentSlug: "travel-entertainment",
    isDeductible: true,
  },
  {
    code: "720",
    nameJa: "通信費",
    nameEn: "Communication Expenses",
    slug: "internet-and-telephone",
    parentSlug: "operations",
    isDeductible: true,
    notes: "電話代、インターネット代、郵便代",
  },
  {
    code: "730",
    nameJa: "広告宣伝費",
    nameEn: "Advertising & Promotion",
    slug: "advertising",
    parentSlug: "sales-marketing",
    isDeductible: true,
  },
  {
    code: "740",
    nameJa: "接待交際費",
    nameEn: "Entertainment Expenses",
    slug: "meals",
    parentSlug: "travel-entertainment",
    isDeductible: true,
    deductionRateLimit: 0.5,
    notes: "法人の場合、一部損金不算入あり",
  },
  {
    code: "750",
    nameJa: "会議費",
    nameEn: "Meeting Expenses",
    slug: "meals",
    parentSlug: "travel-entertainment",
    isDeductible: true,
    notes: "一人あたり5,000円以下の飲食費",
  },
  {
    code: "760",
    nameJa: "消耗品費",
    nameEn: "Consumable Supplies",
    slug: "office-supplies",
    parentSlug: "operations",
    isDeductible: true,
    notes: "10万円未満の物品",
  },
  {
    code: "770",
    nameJa: "事務用品費",
    nameEn: "Office Supplies",
    slug: "office-supplies",
    parentSlug: "operations",
    isDeductible: true,
  },
  {
    code: "780",
    nameJa: "水道光熱費",
    nameEn: "Utilities",
    slug: "utilities",
    parentSlug: "operations",
    isDeductible: true,
    notes: "水道、電気、ガス代",
  },
  {
    code: "790",
    nameJa: "地代家賃",
    nameEn: "Rent",
    slug: "rent",
    parentSlug: "operations",
    isDeductible: true,
    notes: "オフィス・店舗の賃料",
  },

  // ===== 経費 (Operating Expenses) - 800番台 =====
  {
    code: "810",
    nameJa: "支払手数料",
    nameEn: "Service Fees",
    slug: "fees",
    parentSlug: "banking-finance",
    isDeductible: true,
    notes: "銀行振込手数料、決済手数料等",
  },
  {
    code: "811",
    nameJa: "振込手数料",
    nameEn: "Bank Transfer Fees",
    slug: "banking-fees",
    parentSlug: "banking-finance",
    isDeductible: true,
  },
  {
    code: "812",
    nameJa: "決済手数料",
    nameEn: "Payment Processing Fees",
    slug: "processor-fees",
    parentSlug: "banking-finance",
    isDeductible: true,
    notes: "クレジットカード決済手数料等",
  },
  {
    code: "820",
    nameJa: "租税公課",
    nameEn: "Taxes & Public Charges",
    slug: "government-fees",
    parentSlug: "taxes",
    isDeductible: true,
    notes: "事業税、固定資産税、印紙税等（所得税・住民税は除く）",
  },
  {
    code: "830",
    nameJa: "保険料",
    nameEn: "Insurance",
    slug: "insurance",
    parentSlug: "professional-services",
    isDeductible: true,
    notes: "事業用の損害保険、賠償責任保険等",
  },
  {
    code: "840",
    nameJa: "修繕費",
    nameEn: "Repairs & Maintenance",
    slug: "facilities-expenses",
    parentSlug: "operations",
    isDeductible: true,
  },
  {
    code: "850",
    nameJa: "荷造運賃",
    nameEn: "Shipping & Packaging",
    slug: "shipping",
    parentSlug: "operations",
    isDeductible: true,
  },
  {
    code: "860",
    nameJa: "減価償却費",
    nameEn: "Depreciation",
    slug: "fixed-assets",
    parentSlug: "assets-capex",
    isDeductible: true,
    notes: "固定資産の減価償却",
  },
  {
    code: "870",
    nameJa: "リース料",
    nameEn: "Lease Payments",
    slug: "leases",
    parentSlug: "liabilities-debt",
    isDeductible: true,
  },
  {
    code: "880",
    nameJa: "諸会費",
    nameEn: "Membership Fees",
    slug: "non-software-subscriptions",
    parentSlug: "technology",
    isDeductible: true,
    notes: "業界団体会費、商工会費等",
  },
  {
    code: "890",
    nameJa: "雑費",
    nameEn: "Miscellaneous Expenses",
    slug: "other",
    parentSlug: "system",
    isDeductible: true,
  },

  // ===== 専門サービス費 =====
  {
    code: "821",
    nameJa: "顧問料",
    nameEn: "Professional Advisor Fees",
    slug: "professional-services-fees",
    parentSlug: "professional-services",
    isDeductible: true,
    notes: "税理士、弁護士、社労士等への顧問料",
  },
  {
    code: "822",
    nameJa: "支払報酬",
    nameEn: "Professional Fees",
    slug: "professional-services-fees",
    parentSlug: "professional-services",
    isDeductible: true,
    notes: "源泉徴収対象となる報酬",
  },

  // ===== IT・ソフトウェア費 =====
  {
    code: "491",
    nameJa: "ソフトウェア利用料",
    nameEn: "Software Subscriptions",
    slug: "software",
    parentSlug: "technology",
    isDeductible: true,
    notes: "SaaS、クラウドサービス利用料",
  },
  {
    code: "492",
    nameJa: "クラウドサービス費",
    nameEn: "Cloud Services",
    slug: "software",
    parentSlug: "technology",
    isDeductible: true,
    notes: "AWS、GCP、Azure等",
  },

  // ===== 金融関連 =====
  {
    code: "910",
    nameJa: "支払利息",
    nameEn: "Interest Expense",
    slug: "interest-expense",
    parentSlug: "banking-finance",
    isDeductible: true,
  },
  {
    code: "920",
    nameJa: "為替差損",
    nameEn: "Foreign Exchange Loss",
    slug: "banking-fees",
    parentSlug: "banking-finance",
    isDeductible: true,
  },

  // ===== 税金 =====
  {
    code: "930",
    nameJa: "法人税等",
    nameEn: "Corporate Tax",
    slug: "income-tax-payments",
    parentSlug: "taxes",
    isDeductible: false,
    notes: "法人税、住民税、事業税",
  },
  {
    code: "940",
    nameJa: "消費税",
    nameEn: "Consumption Tax",
    slug: "vat-gst-pst-qst-payments",
    parentSlug: "taxes",
    isDeductible: false,
    notes: "納付する消費税",
  },

  // ===== 事業主勘定（個人事業主用） =====
  {
    code: "950",
    nameJa: "事業主貸",
    nameEn: "Owner Draws",
    slug: "owner-draws",
    parentSlug: "owner-equity",
    isDeductible: false,
    notes: "個人事業主が事業資金から私用で引き出した金額",
  },
  {
    code: "951",
    nameJa: "事業主借",
    nameEn: "Owner Investment",
    slug: "capital-investment",
    parentSlug: "owner-equity",
    isDeductible: false,
    notes: "個人事業主が私的資金を事業に投入した金額",
  },

  // ===== 資産 =====
  {
    code: "110",
    nameJa: "現金",
    nameEn: "Cash",
    slug: "transfer",
    parentSlug: "banking-finance",
    isDeductible: false,
  },
  {
    code: "120",
    nameJa: "普通預金",
    nameEn: "Checking Account",
    slug: "transfer",
    parentSlug: "banking-finance",
    isDeductible: false,
  },
  {
    code: "130",
    nameJa: "売掛金",
    nameEn: "Accounts Receivable",
    slug: "payouts",
    parentSlug: "banking-finance",
    isDeductible: false,
  },
  {
    code: "140",
    nameJa: "前払費用",
    nameEn: "Prepaid Expenses",
    slug: "prepaid-expenses",
    parentSlug: "assets-capex",
    isDeductible: false,
  },
  {
    code: "150",
    nameJa: "工具器具備品",
    nameEn: "Tools & Equipment",
    slug: "equipment",
    parentSlug: "operations",
    isDeductible: true,
    notes: "10万円以上の備品（減価償却対象）",
  },

  // ===== 負債 =====
  {
    code: "210",
    nameJa: "買掛金",
    nameEn: "Accounts Payable",
    slug: "transfer",
    parentSlug: "banking-finance",
    isDeductible: false,
  },
  {
    code: "220",
    nameJa: "未払金",
    nameEn: "Accrued Expenses",
    slug: "transfer",
    parentSlug: "banking-finance",
    isDeductible: false,
  },
  {
    code: "230",
    nameJa: "預り金",
    nameEn: "Withholdings",
    slug: "payroll-tax-remittances",
    parentSlug: "taxes",
    isDeductible: false,
    notes: "源泉所得税、住民税の預り",
  },
  {
    code: "240",
    nameJa: "借入金",
    nameEn: "Loans Payable",
    slug: "loan-proceeds",
    parentSlug: "banking-finance",
    isDeductible: false,
  },
  {
    code: "250",
    nameJa: "前受金",
    nameEn: "Deferred Revenue",
    slug: "deferred-revenue",
    parentSlug: "liabilities-debt",
    isDeductible: false,
  },
] as const;

/**
 * Get Japanese account code by Midday category slug
 */
export function getJapaneseAccountBySlug(
  slug: string
): JapaneseAccountCode | undefined {
  return JAPANESE_ACCOUNT_CODES.find((account) => account.slug === slug);
}

/**
 * Get Japanese account code by code number
 */
export function getJapaneseAccountByCode(
  code: string
): JapaneseAccountCode | undefined {
  return JAPANESE_ACCOUNT_CODES.find((account) => account.code === code);
}

/**
 * Get all Japanese accounts for a parent category
 */
export function getJapaneseAccountsByParent(
  parentSlug: string
): JapaneseAccountCode[] {
  return JAPANESE_ACCOUNT_CODES.filter(
    (account) => account.parentSlug === parentSlug
  );
}

/**
 * Get all deductible expense accounts
 */
export function getDeductibleAccounts(): JapaneseAccountCode[] {
  return JAPANESE_ACCOUNT_CODES.filter((account) => account.isDeductible);
}

/**
 * Japanese category name mapping
 * Provides Japanese translations for all parent categories
 */
export const CATEGORY_NAMES_JP: Record<string, string> = {
  // Parent categories
  revenue: "収益",
  "cost-of-goods-sold": "売上原価",
  "sales-marketing": "販売・マーケティング費",
  operations: "営業経費",
  "professional-services": "専門サービス費",
  "human-resources": "人件費",
  "travel-entertainment": "旅費・交際費",
  technology: "情報システム費",
  "banking-finance": "金融費用",
  "assets-capex": "資産",
  "liabilities-debt": "負債",
  taxes: "租税公課",
  "owner-equity": "事業主勘定",
  system: "システム",

  // Child categories
  income: "売上高",
  "product-sales": "商品売上",
  "service-revenue": "サービス売上",
  "consulting-revenue": "コンサルティング売上",
  "subscription-revenue": "サブスクリプション売上",
  "interest-income": "受取利息",
  "other-income": "雑収入",
  "customer-refunds": "返品・返金",
  "chargebacks-disputes": "チャージバック",
  inventory: "仕入高",
  manufacturing: "製造原価",
  "shipping-inbound": "仕入運賃",
  "duties-customs": "関税",
  marketing: "マーケティング費",
  advertising: "広告宣伝費",
  website: "ウェブサイト費",
  events: "イベント費",
  "promotional-materials": "販促物",
  "office-supplies": "消耗品費",
  rent: "地代家賃",
  utilities: "水道光熱費",
  "facilities-expenses": "修繕費",
  equipment: "備品費",
  "internet-and-telephone": "通信費",
  shipping: "荷造運賃",
  "professional-services-fees": "顧問料・報酬",
  contractors: "外注費",
  insurance: "保険料",
  salary: "給料賃金",
  training: "研修費",
  benefits: "福利厚生費",
  travel: "旅費交通費",
  meals: "接待交際費",
  activity: "レクリエーション費",
  software: "ソフトウェア費",
  "non-software-subscriptions": "諸会費",
  transfer: "振替",
  "credit-card-payment": "クレジットカード支払",
  "banking-fees": "銀行手数料",
  "loan-proceeds": "借入金",
  "loan-principal-repayment": "借入金返済",
  "interest-expense": "支払利息",
  payouts: "入金",
  "processor-fees": "決済手数料",
  fees: "支払手数料",
  "fixed-assets": "固定資産",
  "prepaid-expenses": "前払費用",
  leases: "リース料",
  "deferred-revenue": "前受金",
  "vat-gst-pst-qst-payments": "消費税",
  "sales-use-tax-payments": "売上税",
  "income-tax-payments": "法人税等",
  "payroll-tax-remittances": "源泉所得税",
  "employer-taxes": "社会保険料",
  "government-fees": "租税公課",
  "owner-draws": "事業主貸",
  "capital-investment": "事業主借",
  "charitable-donations": "寄付金",
  uncategorized: "未分類",
  other: "その他",
  "internal-transfer": "内部振替",
};

/**
 * Get Japanese name for a category
 */
export function getCategoryNameJa(slug: string): string {
  return CATEGORY_NAMES_JP[slug] ?? slug;
}

/**
 * Common AI enrichment patterns for Japanese transactions
 * Used for automatic categorization of bank transaction descriptions
 */
export const JAPANESE_MERCHANT_PATTERNS: Array<{
  pattern: RegExp;
  accountCode: string;
  description: string;
}> = [
  // Transportation
  { pattern: /JR[東西]?|新幹線|モバイルSuica/i, accountCode: "710", description: "旅費交通費 - 鉄道" },
  { pattern: /ANA|JAL|ジェットスター|ピーチ/i, accountCode: "710", description: "旅費交通費 - 航空" },
  { pattern: /タクシー|UBER|DiDi|GO|S\.RIDE/i, accountCode: "710", description: "旅費交通費 - タクシー" },

  // Communication
  { pattern: /NTT|KDDI|au|ソフトバンク|楽天モバイル|docomo/i, accountCode: "720", description: "通信費 - 携帯電話" },
  { pattern: /AWS|AMAZON WEB|GOOGLE CLOUD|AZURE|さくらインターネット/i, accountCode: "492", description: "クラウドサービス費" },

  // Advertising
  { pattern: /GOOGLE ADS|FACEBOOK|META ADS|TWITTER ADS|LINE ADS/i, accountCode: "730", description: "広告宣伝費" },

  // Entertainment
  { pattern: /居酒屋|レストラン|カフェ|BAR|焼肉|寿司|うどん|蕎麦/i, accountCode: "740", description: "接待交際費 - 飲食" },
  { pattern: /スターバックス|ドトール|タリーズ|STARBUCKS/i, accountCode: "750", description: "会議費" },

  // Office supplies
  { pattern: /アスクル|ASKUL|カウネット|オフィスデポ|LOHACO/i, accountCode: "770", description: "事務用品費" },
  { pattern: /AMAZON|楽天市場|ヨドバシ|ビックカメラ/i, accountCode: "760", description: "消耗品費" },

  // Utilities
  { pattern: /東京電力|関西電力|中部電力|東京ガス|大阪ガス/i, accountCode: "780", description: "水道光熱費" },

  // Software
  { pattern: /GITHUB|NOTION|SLACK|FIGMA|ADOBE|MICROSOFT|GOOGLE WORKSPACE/i, accountCode: "491", description: "ソフトウェア利用料" },
  { pattern: /CHATGPT|OPENAI|ANTHROPIC/i, accountCode: "491", description: "ソフトウェア利用料 - AI" },

  // Banking
  { pattern: /振込手数料|ATM手数料/i, accountCode: "811", description: "振込手数料" },
  { pattern: /STRIPE|PAYPAL|SQUARE/i, accountCode: "812", description: "決済手数料" },

  // Professional services
  { pattern: /税理士|弁護士|社労士|行政書士|司法書士/i, accountCode: "821", description: "顧問料" },

  // Insurance
  { pattern: /損保|生保|保険|東京海上|三井住友海上|あいおい/i, accountCode: "830", description: "保険料" },
];

/**
 * Suggest account code based on transaction description
 */
export function suggestAccountCode(description: string): {
  code: string;
  nameJa: string;
  confidence: "high" | "medium" | "low";
} | null {
  for (const { pattern, accountCode, description: patternDesc } of JAPANESE_MERCHANT_PATTERNS) {
    if (pattern.test(description)) {
      const account = getJapaneseAccountByCode(accountCode);
      if (account) {
        return {
          code: accountCode,
          nameJa: account.nameJa,
          confidence: "high",
        };
      }
    }
  }
  return null;
}

export type JapaneseAccountCodeType = (typeof JAPANESE_ACCOUNT_CODES)[number]["code"];
