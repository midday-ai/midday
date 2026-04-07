export type UnknownAppConfig = Record<string, unknown>;

export type SlackAppConfig = {
  access_token: string;
  team_id: string;
  team_name: string;
  channel: string;
  channel_id: string;
  slack_configuration_url: string;
  url: string;
  bot_user_id: string;
};

export type WhatsAppConnection = {
  phoneNumber: string;
  displayName?: string;
  connectedAt: string;
};

export type WhatsAppAppConfig = {
  connections?: WhatsAppConnection[];
};

export type TelegramConnection = {
  userId: string;
  chatId: string;
  username?: string;
  displayName?: string;
  connectedAt: string;
};

export type TelegramAppConfig = {
  connections?: TelegramConnection[];
};

export type XeroAppConfig = {
  provider: "xero";
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tenantId: string;
  tenantName?: string;
  scope: string[];
};

export type QuickBooksAppConfig = {
  provider: "quickbooks";
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  realmId: string;
  companyName?: string;
  scope: string[];
};

export type FortnoxAppConfig = {
  provider: "fortnox";
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  companyId: string;
  companyName?: string;
  scope: string[];
};

export type AppConfigById = {
  slack: SlackAppConfig;
  telegram: TelegramAppConfig;
  whatsapp: WhatsAppAppConfig;
  xero: XeroAppConfig;
  quickbooks: QuickBooksAppConfig;
  fortnox: FortnoxAppConfig;
};

export type KnownAppId = keyof AppConfigById;

export type AppConfigFor<TAppId extends string> = TAppId extends KnownAppId
  ? AppConfigById[TAppId]
  : UnknownAppConfig;

export type AnyTypedAppConfig = AppConfigById[KnownAppId];
export type AnyAppConfig = AnyTypedAppConfig | UnknownAppConfig;
