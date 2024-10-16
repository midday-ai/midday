import { Database, Tables } from "./db";

type BankAccountSchema = Tables<"bank_accounts">;
type BankConnectionSchema = Tables<"bank_connections">;
type UserSchema = Tables<"users">;
type TransactionSchema = Tables<"transactions">;
type TeamSchema = Tables<"teams">;
type TransactionCategorySchema = Tables<"transaction_categories">;
type InboxSchema = Tables<"inbox">;
type DocumentSchema = Tables<"documents">;
type TrackerProjectSchema = Tables<"tracker_projects">;
type TrackerEntrySchema = Tables<"tracker_entries">;
type ReportSchema = Tables<"reports">;
type SubscriptionSchema = Tables<"subscriptions">;
type PriceSchema = Tables<"prices">;
type ProductSchema = Tables<"products">;
type RecurringTransactionSchema = Tables<"recurring_transactions">;
type ReportsSchema = Tables<"reports">;
type PersonalFinanceCategorySchema = Tables<"personal_finance_categories">;
type TransactionIDSchema = Tables<"transaction_ids">;

// Union types from the database schema
type AccountType = Database["public"]["Enums"]["account_type"];
type BankProviders = Database["public"]["Enums"]["bank_providers"];
type ConnectionStatus = Database["public"]["Enums"]["connection_status"];
type InboxStatus = Database["public"]["Enums"]["inbox_status"];
type InboxType = Database["public"]["Enums"]["inbox_type"];
type PricingPlanInterval = Database["public"]["Enums"]["pricing_plan_interval"];
type PricingType = Database["public"]["Enums"]["pricing_type"];
type ReportTypes = Database["public"]["Enums"]["reportTypes"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
type TeamRoles = Database["public"]["Enums"]["teamRoles"];
type TrackerStatus = Database["public"]["Enums"]["trackerStatus"];
type TransactionFrequency =
  Database["public"]["Enums"]["transaction_frequency"];
type TransactionCategories =
  Database["public"]["Enums"]["transactionCategories"];
type TransactionMethods = Database["public"]["Enums"]["transactionMethods"];
type TransactionStatus = Database["public"]["Enums"]["transactionStatus"];
type UserTier = Database["public"]["Enums"]["user_tier"];

type RecurringTransactionsForInsert =
  Database["public"]["Tables"]["recurring_transactions"]["Insert"] & {
    personal_finance_category: {
      primary: string;
      detailed: string;
      confidence_level: string;
    };
    transaction_ids: string[];
  };

// combined types
type UserWithTeam = UserSchema & { team: TeamSchema };
type UserWithTeams = UserSchema & { teams: TeamSchema[] };
type BankAccountWithTeam = BankAccountSchema & { team: TeamSchema };
type BankAccountWithBankConnection = BankAccountSchema & {
  bank_connection: BankConnectionSchema;
};

export type {
  // Union types
  AccountType,
  BankAccountSchema,
  BankAccountWithBankConnection,
  BankAccountWithTeam,
  BankConnectionSchema,
  BankProviders,
  ConnectionStatus,
  DocumentSchema,
  InboxSchema,
  InboxStatus,
  InboxType,
  PersonalFinanceCategorySchema,
  PriceSchema,
  PricingPlanInterval,
  PricingType,
  ProductSchema,
  RecurringTransactionSchema,
  RecurringTransactionsForInsert,
  ReportSchema,
  ReportsSchema,
  ReportTypes,
  SubscriptionSchema,
  SubscriptionStatus,
  TeamRoles,
  TeamSchema,
  TrackerEntrySchema,
  TrackerProjectSchema,
  TrackerStatus,
  TransactionCategories,
  TransactionCategorySchema,
  TransactionFrequency,
  TransactionIDSchema,
  TransactionMethods,
  TransactionSchema,
  TransactionStatus,
  UserSchema,
  UserTier,
  UserWithTeam,
};
