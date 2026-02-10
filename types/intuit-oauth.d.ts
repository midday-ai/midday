declare module "intuit-oauth" {
  interface OAuthClientConfig {
    clientId: string;
    clientSecret: string;
    environment: "sandbox" | "production";
    redirectUri: string;
    logging?: boolean;
    token?: Token;
  }

  interface Token {
    token_type: string;
    access_token: string;
    expires_in: number;
    refresh_token: string;
    x_refresh_token_expires_in: number;
    id_token?: string;
    createdAt?: number;
    realmId?: string;
  }

  interface AuthorizeUriParams {
    scope: string[];
    state?: string;
  }

  interface AuthResponse {
    getToken(): Token;
    json: Token;
    status(): number;
    text(): string;
    get_intuit_tid(): string;
  }

  interface MakeApiCallParams {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: string;
  }

  class OAuthClient {
    constructor(config: OAuthClientConfig);

    static scopes: {
      Accounting: string;
      Payment: string;
      Payroll: string;
      TimeTracking: string;
      Benefits: string;
      Profile: string;
      Email: string;
      Phone: string;
      Address: string;
      OpenId: string;
      Intuit_name: string;
    };

    token: {
      getToken(): Token;
      setToken(token: Token): void;
    };

    environment: {
      sandbox: string;
      production: string;
    };

    authorizeUri(params: AuthorizeUriParams): string;
    createToken(parseRedirect: string): Promise<AuthResponse>;
    refresh(): Promise<AuthResponse>;
    refreshUsingToken(refreshToken: string): Promise<AuthResponse>;
    revoke(params?: Partial<Token>): Promise<AuthResponse>;
    isAccessTokenValid(): boolean;
    getToken(): { getToken(): Token };
    setToken(token: Token): void;
    makeApiCall(params: MakeApiCallParams): Promise<AuthResponse>;
    validateIdToken(): Promise<boolean>;
  }

  export = OAuthClient;
}
