/**
 * Japanese Bank CSV Format Presets
 * Midday-JP
 *
 * Column mappings for major Japanese banks and accounting software exports.
 */

export interface BankPreset {
  name: string;
  nameEn: string;
  columns: {
    date: string;
    description: string;
    amount: string;
    balance?: string;
  };
  currency: string;
  dateFormat?: string;
  /** For banks with separate deposit/withdrawal columns */
  separateColumns?: {
    deposit: string;
    withdrawal: string;
  };
  /** Additional notes about this format */
  notes?: string;
}

/**
 * Japanese bank CSV format presets
 */
export const BANK_PRESETS_JP: Record<string, BankPreset> = {
  mitsubishi_ufj: {
    name: "三菱UFJ銀行",
    nameEn: "MUFG Bank",
    columns: {
      date: "取引日",
      description: "摘要",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
    notes: "インターネットバンキングからダウンロード",
  },
  mizuho: {
    name: "みずほ銀行",
    nameEn: "Mizuho Bank",
    columns: {
      date: "取引日",
      description: "摘要",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
  },
  mitsui_sumitomo: {
    name: "三井住友銀行",
    nameEn: "SMBC",
    columns: {
      date: "取引日",
      description: "摘要",
      amount: "お預入れ金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
    separateColumns: {
      deposit: "お預入れ金額",
      withdrawal: "お引出し金額",
    },
    notes: "入金・出金が別カラムの場合あり",
  },
  rakuten: {
    name: "楽天銀行",
    nameEn: "Rakuten Bank",
    columns: {
      date: "日付",
      description: "内容",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
  },
  sumishin_sbi: {
    name: "住信SBIネット銀行",
    nameEn: "SBI Sumishin Net Bank",
    columns: {
      date: "日付",
      description: "内容",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
  },
  paypay: {
    name: "PayPay銀行",
    nameEn: "PayPay Bank",
    columns: {
      date: "取引日",
      description: "摘要",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
  },
  sony: {
    name: "ソニー銀行",
    nameEn: "Sony Bank",
    columns: {
      date: "日付",
      description: "摘要",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
  },
  aeon: {
    name: "イオン銀行",
    nameEn: "AEON Bank",
    columns: {
      date: "取引日",
      description: "お取引内容",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
  },
  japan_post: {
    name: "ゆうちょ銀行",
    nameEn: "Japan Post Bank",
    columns: {
      date: "取扱日",
      description: "お取り扱い内容",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
    notes: "ゆうちょダイレクトからダウンロード",
  },

  // Accounting Software Exports
  freee: {
    name: "freee形式",
    nameEn: "freee Format",
    columns: {
      date: "日付",
      description: "内容",
      amount: "金額",
    },
    currency: "JPY",
    dateFormat: "YYYY-MM-DD",
    notes: "freeeからエクスポートした取引データ",
  },
  moneyforward: {
    name: "MoneyForward形式",
    nameEn: "MoneyForward Format",
    columns: {
      date: "日付",
      description: "内容",
      amount: "金額",
      balance: "残高",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
    notes: "MoneyForwardからエクスポートした取引データ",
  },
  yayoi: {
    name: "弥生会計形式",
    nameEn: "Yayoi Format",
    columns: {
      date: "日付",
      description: "摘要",
      amount: "金額",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
    notes: "弥生会計からエクスポートした仕訳データ",
  },

  // Credit Cards
  rakuten_card: {
    name: "楽天カード",
    nameEn: "Rakuten Card",
    columns: {
      date: "利用日",
      description: "利用店舗",
      amount: "利用金額",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
  },
  amazon_card: {
    name: "Amazon Mastercard",
    nameEn: "Amazon Mastercard",
    columns: {
      date: "利用日",
      description: "利用店名",
      amount: "利用金額",
    },
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
  },
} as const;

export type JapaneseBankPresetKey = keyof typeof BANK_PRESETS_JP;

/**
 * Get all available Japanese bank presets
 */
export function getJapaneseBankPresets(): BankPreset[] {
  return Object.values(BANK_PRESETS_JP);
}

/**
 * Get a specific bank preset by key
 */
export function getJapaneseBankPreset(key: JapaneseBankPresetKey): BankPreset | undefined {
  return BANK_PRESETS_JP[key];
}

/**
 * Get bank presets grouped by category
 */
export function getJapaneseBankPresetsByCategory() {
  return {
    megabanks: ["mitsubishi_ufj", "mizuho", "mitsui_sumitomo"],
    netbanks: ["rakuten", "sumishin_sbi", "paypay", "sony", "aeon"],
    postbank: ["japan_post"],
    software: ["freee", "moneyforward", "yayoi"],
    creditcards: ["rakuten_card", "amazon_card"],
  } as const;
}
