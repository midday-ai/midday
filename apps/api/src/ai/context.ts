export interface AppContext {
  userId: string;
  fullName: string;
  companyName: string;
  baseCurrency: string;
  locale: string;
  currentDateTime: string;
  country?: string;
  city?: string;
  region?: string;
  timezone: string;
  chatId: string;
  teamId?: string;
  fiscalYearStartMonth?: number | null;
  hasBankAccounts?: boolean;
  invoiceId?: string;
  [key: string]: unknown;
}
