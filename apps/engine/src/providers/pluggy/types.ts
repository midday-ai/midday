export type GetTransactionsParams = {
  accountId: string;
  latest?: boolean;
};

export type GetStatusResponse = {
  page: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  status: {
    indicator: string;
    description: string;
  };
};

export type GetInstitutionsRequest = {
  countries?: string[];
  sandbox?: boolean;
};

export type GetAccountsRequest = {
  id: string;
  institutionId: string;
};

export type LinkTokenCreateRequest = {
  userId: string;
  environment?: "sandbox" | "production";
};

export type ConnectTokenResponse = {
  accessToken: string;
};

export const CREDENTIAL_TYPES = [
  "number",
  "password",
  "text",
  "image",
  "select",
  "ethaddress",
  "hcaptcha",
] as const;

export const CONNECTOR_TYPES = [
  "PERSONAL_BANK",
  "BUSINESS_BANK",
  "INVOICE",
  "INVESTMENT",
  "TELECOMMUNICATION",
  "DIGITAL_ECONOMY",
  "PAYMENT_ACCOUNT",
  "OTHER",
] as const;
/**
 * @typedef ConnectorType
 * Type of connectors available
 */
export type ConnectorType = (typeof CONNECTOR_TYPES)[number];

export type CredentialSelectOption = {
  /** Value of the option */
  value: string;
  /** Displayable text or label of the option */
  label: string;
};

export type CredentialType = (typeof CREDENTIAL_TYPES)[number];

export type ConnectorCredential = {
  /** parameter label that describes it */
  label: string;
  /** parameter key name */
  name: string;
  /** type of parameter to create the form */
  type?: CredentialType;
  /** If parameter is used for MFA. */
  mfa?: boolean;
  /** If parameter is image, base64 string is provided */
  data?: string;
  /** Assistive information to help the user provide us the credential */
  assistiveText?: string;
  /** Available options if credential is of type 'select' */
  options?: CredentialSelectOption[];
  /** Regex to validate input */
  validation?: string;
  /** Error message of input validation on institution language */
  validationMessage?: string;
  /** Input's placeholder for help */
  placeholder?: string;
  /** Is this credential optional? */
  optional?: boolean;
  /** Applies to MFA credential only - Detailed information that includes details/hints that the user should be aware of */
  instructions?: string;
  /** Parameter expiration date, input value should be submitted before this date. */
  expiresAt?: Date;
};

export type Connector = {
  id: number;
  /** Financial institution name */
  name: string;
  /** Url of the institution that the connector represents */
  institutionUrl: string;
  /** Image url of the institution. */
  imageUrl: string;
  /** Primary color of the institution */
  primaryColor: string;
  /** Type of the connector */
  type: ConnectorType;
  /** Country of the institution */
  country: string;
  /** List of parameters needed to execute the connector */
  credentials: ConnectorCredential[];
  /** Has MFA steps */
  hasMFA: boolean;
  /** If true, connector has an Oauth login */
  oauth?: boolean;
  /** (only for OAuth connector) this URL is used to connect the user and on success it will redirect to create the new item */
  oauthUrl?: string;
};

export type GetInstitutionsResponse = {
  results: Connector[];
};
